import { DEFAULT_MIME_TYPE } from '@/lib/audio';
import { useRef, useState } from 'react';

export function useAudio({
  deviceId,
  constraints = {},
}: {
  deviceId: string | null;
  constraints?: MediaTrackConstraints;
}) {
  const audioElRef = useRef<HTMLAudioElement>(null);
  const rafId = useRef<number | null>(null);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaStreamSource, setMediaStreamSource] =
    useState<MediaStreamAudioSourceNode | null>(null);
  const [mediaRecorderChunks, setMediaRecorderChunks] = useState<Blob[]>([]);
  const [playbackURL, setPlaybackURL] = useState<string>('');

  async function startStream() {
    if (!deviceId) {
      throw new Error('No device ID provided. Please provide a device ID');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        ...constraints, // e.g. { echoCancellation: true,  sampleRate: 16000 , channelCount: 1 }
        deviceId, // apply the deviceId after constraints to override the deviceId passed in params
      },
    });
    setAudioStream(stream);
    return stream;
  }

  async function createMediaRecorder(
    stream: MediaStream | null = audioStream,
    chunkSize: number | undefined,
    options: MediaRecorderOptions = {},
  ) {
    if (!stream || !stream.active) {
      throw new Error('No audio stream. Please call startStream() first');
    }

    if (audioContext !== null) {
      audioContext.close();
      setAudioContext(null);
    }

    const opts = {
      mimeType: DEFAULT_MIME_TYPE,
      ...options,
    };

    const recorder = new MediaRecorder(stream, opts);
    setMediaRecorder(recorder);

    recorder.start(chunkSize || undefined);
    recorder.ondataavailable = e => {
      if (e.data.size === 0) return;
      setMediaRecorderChunks(oldChunks => [...oldChunks, e.data]);
    };

    recorder.onstop = function () {
      const blob = new Blob(mediaRecorderChunks, {
        type: opts.mimeType,
      });
      const url = URL.createObjectURL(blob);
      setPlaybackURL(url);
      setMediaRecorderChunks([]);
    };

    return recorder;
  }

  async function createAudioContext(
    stream: MediaStream | null = audioStream,
    options: AudioContextOptions = {},
  ): Promise<{ ctx: AudioContext; source: MediaStreamAudioSourceNode }> {
    if (!stream || !stream.active) {
      throw new Error('No audio stream. Please call startStream() first');
    }

    if (mediaRecorder !== null) {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }

    const ctx = new AudioContext({
      ...options,
      ...(!options.sampleRate &&
        constraints.sampleRate && {
          sampleRate: constraints.sampleRate as number,
        }),
    });
    setAudioContext(ctx);
    const source = ctx.createMediaStreamSource(stream);
    setMediaStreamSource(source);
    await ctx.resume();
    return { ctx, source };
  }

  async function createWorkletProcessor(
    ctx: AudioContext,
    name = 'audioProcessor',
    scriptURL: string,
    subscriber: ((data: any) => void) | null = null,
    destination: AudioNode | null = null,
  ): Promise<AudioWorkletNode> {
    if (!ctx) {
      throw new Error(
        'No audio context. Please call createAudioContext() first',
      );
    }
    if (!scriptURL) {
      throw new Error('No scriptURL supplied. Please provide a scriptURL');
    }

    await ctx.audioWorklet.addModule(scriptURL);
    const worklet = new AudioWorkletNode(ctx, name);

    if (subscriber) {
      worklet.port.onmessage = event => {
        subscriber(event.data);
      };
    }

    if (destination) {
      worklet.connect(destination);
    }

    return worklet;
  }

  async function createAnalyser(
    ctx: AudioContext,
    opts: AnalyserOptions = {},
    subscriber?: (data: Uint8Array) => void,
  ): Promise<AnalyserNode> {
    if (!subscriber) {
      throw new Error('No subscriber. Please provide a subscriber function');
    }

    const analyser = new AnalyserNode(ctx, opts);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    rafId.current = requestAnimationFrame(tick);

    function tick() {
      analyser.getByteTimeDomainData(dataArray);
      subscriber?.(dataArray);
      rafId.current = requestAnimationFrame(tick);
    }

    return analyser;
  }

  const teardown = async () => {
    mediaRecorder?.stop();
    setMediaRecorder(null);

    audioStream?.getTracks().forEach(track => track.stop());
    setAudioStream(null);

    await audioContext?.close();
    setAudioContext(null);

    mediaStreamSource?.disconnect();
    setMediaStreamSource(null);

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  return {
    audioElRef,
    audioStream,
    audioContext,
    mediaStreamSource,
    playbackURL,
    createAudioContext,
    createWorkletProcessor,
    createAnalyser,
    createMediaRecorder,
    startStream,
    stopStream: teardown,
  };
}
