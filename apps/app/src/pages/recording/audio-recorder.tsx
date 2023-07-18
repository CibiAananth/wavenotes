/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useRef, useState } from 'react';
import {
  SAMPLE_RATE,
  SAMPLE_SIZE,
  scriptURL,
  pcmToWav,
  combinePCMChunks,
} from './utils';
import { Buffer } from 'buffer';
import { io, Socket } from 'socket.io-client';

const chunkInterval = 100;

const AudioRecorder = ({ recordingState }: any) => {
  const audioEl = useRef<HTMLAudioElement>(null);
  const bufferIntervalId = useRef<number | null>(null);
  const socket = useRef<Socket | null>(null);
  const chunksInPCMRef = useRef<Int16Array | null>(null);

  const [startInterval, setStartInterval] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [chunksInPCM, setChunksInPCM] = useState<Int16Array | null>(null);
  const [recordingInPCM, setRecordingInPCM] = useState<Int16Array | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [channelCount, setChannelCount] = useState<number>(2);
  const [transcript, setTranscript] = useState<string | null>(null);

  useEffect(() => {
    chunksInPCMRef.current = chunksInPCM; // Update ref with latest state
    if (bufferIntervalId.current === null && startInterval) {
      bufferIntervalId.current = window.setInterval(() => {
        if (chunksInPCMRef.current?.length) {
          const pcmChunk = Buffer.from(chunksInPCMRef.current.buffer);
          socket.current?.emit('pcmChunk', pcmChunk); // Sending the audio chunk

          const wavChunk = Buffer.from(chunksInPCMRef.current.buffer);
          socket.current?.emit('wavChunk', wavChunk); // Sending the audio chunk

          setChunksInPCM(null); // Reset the chunk for the next interval
        }
      }, chunkInterval);
    }

    return () => {
      if (bufferIntervalId.current !== null && !startInterval) {
        clearInterval(bufferIntervalId.current);
      }
    };
  }, [chunksInPCM, startInterval, channelCount]);

  const initSocket = () => {
    socket.current = io('http://localhost:3333', {
      path: '/custom/',
    });

    socket.current.on('connect', () => {
      console.log('connected');
      socket.current?.emit('join', 'test');
    });

    socket.current.on('transcript', (data: string) => {
      console.log('transcript', data);
      setTranscript(data);
    });

    socket.current.on('disconnect', () => {
      console.log('disconnected');
    });
  };

  const handleStart = async () => {
    initSocket();

    const device = await navigator.mediaDevices
      .enumerateDevices()
      .then((devices): Promise<string> => {
        console.log('devices', devices);

        const [microphone] = devices.filter(
          (device) =>
            device.kind === 'audioinput' && device.label.includes('Air')
        );
        return new Promise((resolve) => {
          resolve(microphone.deviceId);
        });
      });

    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: device,
        sampleRate: { ideal: SAMPLE_RATE },
        sampleSize: { ideal: SAMPLE_SIZE, max: SAMPLE_SIZE }, // in bits per linear sample
      },
    });

    const ctx = new AudioContext({
      sampleRate: SAMPLE_RATE,
    });
    const source = ctx.createMediaStreamSource(stream);
    await ctx.resume();
    await ctx.audioWorklet.addModule(scriptURL);
    const worklet = new AudioWorkletNode(ctx, 'audioProcessor');
    setChannelCount(worklet.channelCount);

    worklet.port.onmessage = (event: { data: Float32Array[] }) => {
      if (!startInterval) setStartInterval(true);

      const combinedData: Int16Array = combinePCMChunks(event.data);

      setRecordingInPCM((prev) => {
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
      setChunksInPCM((prev) => {
        if (prev === null) {
          return combinedData;
        }

        const newChunks = new Int16Array(prev.length + combinedData.length);
        newChunks.set(prev);
        newChunks.set(combinedData, prev.length);
        return newChunks;
      });
    };

    source.connect(worklet);
    worklet.connect(ctx.destination);

    setStream(stream);
    setAudioContext(ctx);
    setRecording(true);
  };

  const handleStop = async () => {
    if (audioContext) {
      stream?.getTracks().forEach((track) => track.stop());
      await audioContext.close();
      setAudioContext(null); // Reset the audio context
      setRecording(false);
    }

    if (bufferIntervalId.current) {
      window.clearInterval(bufferIntervalId.current);
      bufferIntervalId.current = null;
    }

    socket.current?.disconnect();
    socket.current = null;
  };

  const handlePlay = () => {
    if (recordingInPCM?.length === 0) {
      return;
    }

    const wavData = pcmToWav(recordingInPCM as Int16Array, channelCount);
    const blobUrl = URL.createObjectURL(
      new Blob([wavData], { type: 'audio/wav' })
    );
    audioEl.current!.src = blobUrl;
    setAudioUrl(blobUrl);
    setRecordingInPCM(null);
    setStream(null);
  };

  const handleDownload = () => {
    if (recordingInPCM?.length === 0) {
      return;
    }

    const wavData = pcmToWav(recordingInPCM as Int16Array, channelCount);
    const blobUrl = URL.createObjectURL(
      new Blob([wavData], { type: 'audio/wav' })
    );

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'audio.wav';
    a.click();
    a.remove();
  };

  return (
    <div>
      <audio ref={audioEl} src={audioUrl} controls />
      <div>
        <p>Transcript</p>
        <p>{transcript}</p>
      </div>
    </div>
  );
};

export default AudioRecorder;
