import { useCallback, useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';

import {
  combinePCMChunks,
  scriptURL,
  DEFAULT_SAMPLE_RATE,
  DEFAULT_SAMPLE_SIZE,
  writeWavHeaders,
  WAV_MIME_TYPE,
} from '@/lib/audio';
import { useAudio } from './useAudio';
import { useSocket } from './useSocket';

const SAMPLE_RATE = DEFAULT_SAMPLE_RATE; // in hertz
const SAMPLE_SIZE = DEFAULT_SAMPLE_SIZE; // in bits per linear sample
const chunkInterval = 100;

const OPTIONS_ANALYSER = {
  smoothingTime: 0.6,
  fftSize: 512,
};

export function useSpeechToText({ deviceId }: { deviceId: string | null }) {
  const audio = useAudio({
    deviceId,
    constraints: {
      sampleRate: SAMPLE_RATE,
      sampleSize: SAMPLE_SIZE,
    },
  });
  const socket = useSocket(import.meta.env.VITE_SOCKET_URL as string, {
    path: '/custom/',
  });

  const chunksInPCMRef = useRef<Int16Array | null>(null);
  const bufferIntervalId = useRef<number | null>(null);

  const [recordingInPCM, setRecordingInPCM] = useState<Int16Array | null>(null);
  const [chunksInPCM, setChunksInPCM] = useState<Int16Array | null>(null);
  const [startInterval, setStartInterval] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [playBackURL, setPlayBackURL] = useState<string>('');

  useEffect(() => {
    socket.instance?.on('transcript', (data: string) => {
      setTranscript(data);
    });

    return () => {
      socket.instance?.off('transcript');
    };
  }, [socket.instance]);

  useEffect(() => {
    chunksInPCMRef.current = chunksInPCM; // Update ref with latest state
    if (bufferIntervalId.current === null && startInterval) {
      bufferIntervalId.current = window.setInterval(() => {
        if (chunksInPCMRef.current?.length) {
          const pcmChunk = Buffer.from(chunksInPCMRef.current.buffer);
          socket.instance?.emit('pcmChunk', pcmChunk); // Sending the audio chunk
          setChunksInPCM(null); // Reset the chunk for the next interval
        }
      }, chunkInterval);
    }

    return () => {
      if (bufferIntervalId.current !== null && !startInterval) {
        clearInterval(bufferIntervalId.current);
      }
    };
  }, [chunksInPCM, startInterval, audio.channelCount, socket.instance]);

  const processor = useCallback(
    async (data: Float32Array[]) => {
      if (!startInterval) setStartInterval(true);

      const combinedData: Int16Array = combinePCMChunks(data);
      setRecordingInPCM(prev => {
        // append prev Int16Array with new Int16Array combinedData
        if (prev === null) {
          return combinedData;
        }
        const newChunks = new Int16Array(prev.length + combinedData.length);
        newChunks.set(prev);
        newChunks.set(combinedData, prev.length);
        return newChunks;
      });

      // Buffering chunks to be sent
      setChunksInPCM(prev => {
        if (prev === null) {
          return combinedData;
        }

        const newChunks = new Int16Array(prev.length + combinedData.length);
        newChunks.set(prev);
        newChunks.set(combinedData, prev.length);
        return newChunks;
      });
    },
    [startInterval],
  );

  const start = useCallback(async () => {
    try {
      socket.init();
      const stream = await audio.startStream();
      const { ctx, source } = await audio.createAudioContext(stream);
      console.log(ctx);
      const worklet = await audio.createAudioProcessor(
        ctx,
        'audioProcessor',
        scriptURL,
        ctx.destination,
        processor,
      );
      source.connect(worklet);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }, [audio, processor, socket]);

  const destroy = useCallback(async () => {
    await audio.stopStream();
    socket.disconnect();
    setStartInterval(false);
    setRecordingInPCM(null);
    setChunksInPCM(null);

    if (bufferIntervalId.current) {
      window.clearInterval(bufferIntervalId.current);
      bufferIntervalId.current = null;
    }
  }, [audio, socket]);

  const stop = useCallback(async () => {
    try {
      setPlayBackURL(getPlayBackURL() as string);

      await audio.stopStream();
      socket.disconnect();
      setStartInterval(false);

      if (bufferIntervalId.current) {
        window.clearInterval(bufferIntervalId.current);
        bufferIntervalId.current = null;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }, [audio, socket]);

  const getPlayBackURL = useCallback(() => {
    if (recordingInPCM?.length === 0) {
      return null;
    }
    const wavBuffer = writeWavHeaders(
      recordingInPCM as Int16Array,
      audio.channelCount,
    );
    const blobUrl = URL.createObjectURL(
      new Blob([wavBuffer], { type: WAV_MIME_TYPE }),
    );

    return blobUrl;
  }, [audio.channelCount, recordingInPCM]);

  const play = useCallback(async () => {
    if (!audio.audioElRef.current || !getPlayBackURL()?.length) {
      return;
    }
    audio.audioElRef.current.src = getPlayBackURL() as string;
    audio.audioElRef.current?.play();
  }, [audio.audioElRef, getPlayBackURL]);

  useEffect(() => {
    return () => {
      console.log('destroying');
      destroy();
    };
  }, []);

  return {
    start,
    transcript,
    stop,
    play,
    getPlayBackURL,
    playBackURL,
    audioElRef: audio.audioElRef,
  };
}
