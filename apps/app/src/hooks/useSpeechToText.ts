import { useCallback, useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';

import {
  combinePCMChunks,
  DEFAULT_SAMPLE_RATE,
  DEFAULT_SAMPLE_SIZE,
  WAV_MIME_TYPE,
  workletScriptURL,
  WORKLET_NAME,
  writeWavHeaders,
  TEXT_MIME_TYPE,
} from '@/lib/audio';
import { useAudio } from './useAudio';
import { useSocket } from './useSocket';
import { useVisualizer } from './useVisualizer';

const SAMPLE_RATE = DEFAULT_SAMPLE_RATE; // in hertz
const SAMPLE_SIZE = DEFAULT_SAMPLE_SIZE; // in bits per linear sample
const chunkInterval = 100;

const OPTIONS_ANALYSER = {
  smoothingTime: 0.6,
  fftSize: 512,
};

export type Transcript = {
  text: string;
};

export function useSpeechToText({ deviceId }: { deviceId: string | null }) {
  const audio = useAudio({
    deviceId,
    constraints: {
      sampleRate: SAMPLE_RATE,
      sampleSize: SAMPLE_SIZE,
    },
  });
  const socket = useSocket(import.meta.env.VITE_NODE_SERVER_URL, {
    path: import.meta.env.VITE_SOCKET_ENDPOINT,
  });
  const visualizer = useVisualizer();

  const chunksInPCMRef = useRef<Int16Array | null>(null);
  const bufferIntervalId = useRef<number | null>(null);
  const payloadUUID = useRef<string | null>(null);
  const finalTranscript = useRef<Transcript[]>([]);

  const [channelCount, setChannelCount] = useState<number>(1);
  const [liveStatus, setLiveStatus] = useState<boolean>(false);
  const [recordingInPCM, setRecordingInPCM] = useState<Int16Array | null>(null);
  const [chunksInPCM, setChunksInPCM] = useState<Int16Array | null>(null);
  const [startInterval, setStartInterval] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string | null>('');
  const [playBackURL, setPlaybackURL] = useState<string>('');

  useEffect(() => {
    socket.instance?.on('connect', () => {
      setLiveStatus(true);
    });

    socket.instance?.on('disconnect', () => {
      setLiveStatus(false);
    });

    socket.instance?.on('speech.chunks.pcm.transcript', ({ data }) => {
      let interimTranscript = ''; // Clear the interim transcript at the start of each event
      data?.results?.forEach((result: any) => {
        const text = result?.alternatives[0]?.transcript || '';
        if (result.isFinal) {
          finalTranscript.current?.push({ text });
        } else {
          interimTranscript = text; // Assign the latest text to the interim transcript
        }
      });

      // Construct transcript to show in the UI
      const uiTranscript =
        finalTranscript.current?.map(t => t.text).join(' ') + interimTranscript;
      setTranscript(uiTranscript);
    });

    return () => {
      socket.instance?.off('connect');
      socket.instance?.off('disconnect');
      socket.instance?.off('speech.chunks.pcm.transcript');
    };
  }, [socket.instance]);

  useEffect(() => {
    chunksInPCMRef.current = chunksInPCM; // Update ref with latest state
    if (bufferIntervalId.current === null && startInterval) {
      bufferIntervalId.current = window.setInterval(() => {
        if (chunksInPCMRef.current?.length) {
          const pcmChunk = Buffer.from(chunksInPCMRef.current.buffer);
          socket.instance?.emit('speech.chunks.pcm.recognize', {
            id: payloadUUID.current,
            pcmChunk,
          }); // Sending the audio chunk
          setChunksInPCM(null); // Reset the chunk for the next interval
        }
      }, chunkInterval);
    }

    return () => {
      if (bufferIntervalId.current !== null && !startInterval) {
        clearInterval(bufferIntervalId.current);
      }
    };
  }, [chunksInPCM, startInterval, channelCount, socket.instance]);

  const workletProcessor = useCallback(
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
      setTranscript(null);
      finalTranscript.current = [];
      let socketInstance = socket.instance;
      if (!socketInstance?.active) socketInstance = socket.init();

      payloadUUID.current = uuidv4();
      socketInstance?.emit('speech.chunks.pcm.session.start', {
        id: payloadUUID.current,
      });

      const stream = await audio.startStream();
      const { ctx, source } = await audio.createAudioContext(stream);

      const worklet = await audio.createWorkletProcessor(
        ctx,
        WORKLET_NAME,
        workletScriptURL,
        workletProcessor,
      );

      const analyser = await audio.createAnalyser(
        ctx,
        OPTIONS_ANALYSER,
        visualizer.setAudioData,
      );

      source.connect(analyser);
      analyser.connect(worklet);
      worklet.connect(ctx.destination);

      setChannelCount(worklet.channelCount);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }, [socket, audio, workletProcessor, visualizer]);

  const stop = useCallback(async () => {
    try {
      await audio.stopStream();
      const playbackBlob = getPlaybackBlob();
      if (playbackBlob?.size) {
        setPlaybackURL(URL.createObjectURL(playbackBlob));
      }
      visualizer.setAudioData(new Uint8Array(0));

      socket.instance?.emit('speech.chunks.pcm.session.stop', {
        id: payloadUUID.current,
      });
      payloadUUID.current = null;

      setStartInterval(false);
      if (bufferIntervalId.current) {
        window.clearInterval(bufferIntervalId.current);
        bufferIntervalId.current = null;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }, [audio, visualizer]);

  const getPlaybackBlob = () => {
    if (recordingInPCM?.length === 0) {
      return null;
    }
    const wavBuffer = writeWavHeaders(
      recordingInPCM as Int16Array,
      channelCount,
    );
    return new Blob([wavBuffer], { type: WAV_MIME_TYPE });
  };

  const getTranscriptBlob = () => {
    if (!finalTranscript.current?.length) {
      return null;
    }
    const fileTranscript = finalTranscript.current
      .map(t => `${t.text}`)
      .join('\n');

    return new Blob([fileTranscript], { type: TEXT_MIME_TYPE });
  };

  const play = useCallback(async () => {
    const playbackBlob = getPlaybackBlob();
    if (!audio.audioElRef.current || !playbackBlob?.size) {
      return;
    }

    audio.audioElRef.current.src = URL.createObjectURL(playbackBlob);
    audio.audioElRef.current?.play();
  }, [audio.audioElRef]);

  const destroy = useCallback(async () => {
    await audio.stopStream();
    setStartInterval(false);
    setRecordingInPCM(null);
    setChunksInPCM(null);
    setPlaybackURL('');
    setTranscript(null);

    if (bufferIntervalId.current) {
      window.clearInterval(bufferIntervalId.current);
      bufferIntervalId.current = null;
    }
  }, [audio]);

  useEffect(() => {
    return () => {
      console.log('destroying');
      destroy();
    };
  }, []);

  return {
    audioElRef: audio.audioElRef,
    channelCount,
    liveStatus,
    playBackURL,
    recordingInPCM,
    transcript,
    visualizerCanvasRef: visualizer.canvasRef,
    destroy,
    setPlaybackURL,
    getPlaybackBlob,
    getTranscriptBlob,
    play,
    start,
    stop,
  };
}
