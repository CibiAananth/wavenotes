import { useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import {
  Microphone as MicIcon,
  Stop as StopIcon,
  ArrowLeft as ArrowLeftIcon,
  FloppyDisk as SaveIcon,
  Circle as CircleIcon,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

import { useDeviceState } from '@/context/device-provider';
import { useAuth } from '@/context/auth-provider';
import { useSpeechToText } from '@/hooks/useSpeechToText';

import { supabase } from '@/lib/supabase';
import { TEXT_MIME_TYPE, WAV_MIME_TYPE } from '@/lib/audio';

import { recorderMachine, type RecorderEventType } from './recorder-machine';
import { DeviceSelect } from './components/device-select';
import LiveBadge from './components/live-badge';

const CACHE_CONTROL = '86400'; // 1 day

type RecorderActionsType = {
  [K in RecorderEventType['type']]: () => void;
};

type FileUploadState = {
  isUploading: boolean;
  hasError: boolean;
  message: string | null;
};

export default function _Root() {
  const navigate = useNavigate();

  return (
    <div className="mb-10 py-5">
      <Button onClick={() => navigate('/')} variant="outline">
        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <RecorderView />
    </div>
  );
}

function RecorderView() {
  // Get the active device from the device context
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeDevice, hasActiveDevice } = useDeviceState();
  const speechToText = useSpeechToText({ deviceId: activeDevice });

  const audioElRef = useRef<HTMLAudioElement>(null);

  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    isUploading: false,
    hasError: false,
    message: null,
  });

  // Create a new instance of the state machine
  const [current, send] = useMachine(recorderMachine);
  const { value: recordingState } = current;

  const isTranscribing = useMemo(() => {
    return speechToText.liveStatus && recordingState === 'recording';
  }, [recordingState, speechToText.liveStatus]);

  const selectedDevice = useMemo(() => {
    if (!activeDevice?.length) return undefined;
    return hasActiveDevice(activeDevice) ? activeDevice : undefined;
  }, [activeDevice, hasActiveDevice]);

  const uploadFile = async () => {
    const playbackBlob = speechToText.getPlaybackBlob();
    const transcriptBlob = speechToText.getTranscriptBlob();

    console.log(playbackBlob, transcriptBlob);

    if (!playbackBlob?.size) {
      throw new Error(
        'Recording or transcript is corrupted. Unable to fetch blobs',
      );
    }

    setFileUploadState({
      isUploading: true,
      hasError: false,
      message: null,
    });

    const now = Date.now();
    const audioUploadPromise = supabase.storage
      .from('recording')
      .upload(`${user?.id}/rec-${now}.wav`, playbackBlob, {
        upsert: true,
        cacheControl: CACHE_CONTROL,
        contentType: WAV_MIME_TYPE,
      });

    const transcriptUploadPromise = transcriptBlob?.size
      ? supabase.storage
          .from('recording')
          .upload(`${user?.id}/transc-${now}.txt`, transcriptBlob, {
            upsert: true,
            cacheControl: CACHE_CONTROL,
            contentType: TEXT_MIME_TYPE,
          })
      : Promise.resolve();

    const [{ error }] = await Promise.all([
      audioUploadPromise,
      transcriptUploadPromise,
    ]);

    if (error) {
      console.log(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem while uploading the file.',
        action: (
          <ToastAction altText="Try again" onClick={uploadFile}>
            Try again
          </ToastAction>
        ),
      });
      return;
    }

    toast({
      title: 'Sweet!',
      description: 'Your recording has been saved successfully.',
    });

    setFileUploadState({
      isUploading: false,
      hasError: !!error,
      message: error,
    });
  };

  const recorderActions: RecorderActionsType = {
    RECORD: () => {
      speechToText.start();
    },
    STOP: () => {
      speechToText.stop();
    },
    START: () => {
      speechToText.destroy();
      speechToText.start();
    },
    SAVE: async () => {
      await uploadFile();
    },
  };

  const handleRecorderAction = (action: RecorderEventType['type']) => {
    send({ type: action });
    recorderActions[action]?.();
  };

  return (
    <div className="w-full h-[500px] flex justify-center">
      <div className="w-full mt-5 rounded-md border p-2">
        <div className="flex items-start justify-between">
          <div className="w-4/12">
            <DeviceSelect />
          </div>
          <LiveBadge isLive={isTranscribing} />
        </div>

        {selectedDevice ? (
          <>
            <div className="flex w-full justify-center items-center h-[200px]">
              {speechToText.playBackURL ? (
                <audio
                  ref={audioElRef}
                  src={speechToText.playBackURL}
                  controls
                />
              ) : (
                <canvas
                  width={500}
                  height={200}
                  ref={speechToText.visualizerCanvasRef}
                  id="canvas"
                />
              )}
            </div>
            <div className="flex justify-center items-center">
              {recordingState === 'idle' && (
                <Button onClick={() => handleRecorderAction('RECORD')}>
                  <MicIcon className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              )}
              {recordingState === 'recording' && (
                <Button onClick={() => handleRecorderAction('STOP')}>
                  <StopIcon className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              )}
              {recordingState === 'stopped' && (
                <>
                  <Button onClick={() => handleRecorderAction('START')}>
                    <MicIcon className="mr-2 h-4 w-4" />
                    Start New Recording
                  </Button>
                  <Button
                    variant="outline"
                    className="ml-3"
                    onClick={() => handleRecorderAction('SAVE')}
                    disabled={fileUploadState.isUploading}
                  >
                    {fileUploadState.isUploading ? (
                      <CircleIcon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SaveIcon className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="mt-20 text-center">
            Please allow Microphone access and select the input device to start
            recording
          </p>
        )}

        <div className="mt-5 flex justify-center">
          {isTranscribing && !speechToText.transcript && (
            <div className="w-1/2">
              <Skeleton className="h-4 mt-2 w-full" />
              <Skeleton className="h-4 mt-2 w-full" />
              <Skeleton className="h-4 mt-2 w-full" />
              <Skeleton className="h-4 mt-2 w-full" />
              <Skeleton className="h-4 mt-2 w-full" />
              <Skeleton className="h-4 mt-2 w-full" />
              <Skeleton className="h-4 mt-2 w-full" />
            </div>
          )}
          {speechToText.transcript && (
            <p className="w-1/2 text-sm text-left line-clamp-3 bg-muted">
              {speechToText.transcript}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
