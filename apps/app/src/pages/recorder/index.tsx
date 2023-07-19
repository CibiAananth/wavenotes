import { useEffect, useMemo, useRef, useState } from 'react';

import { cva } from 'class-variance-authority';
import { useNavigate } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import {
  Microphone as MicIcon,
  Stop as StopIcon,
  ArrowLeft as ArrowLeftIcon,
  FloppyDisk as SaveIcon,
} from '@phosphor-icons/react';

import { useDeviceState } from '@/context/device-provider';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

import { DeviceSelect } from './device-select';
import { type RecorderEventType, recorderMachine } from './recorder-machine';
import { supabase } from '@/lib/supabase';
import { WAV_MIME_TYPE, writeWavHeaders } from '@/lib/audio';
import { useAuth } from '@/context/auth-provider';
import { CircleIcon } from '@radix-ui/react-icons';

type RecorderActionsType = {
  [K in RecorderEventType['type']]: () => void;
};

export default function _Root() {
  const navigate = useNavigate();

  return (
    <div className="mb-10 py-5">
      <Toaster />
      <Button onClick={() => navigate('/')} variant="outline">
        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <Recording />
    </div>
  );
}

const liveBadgeVariants = cva('bg-primary', {
  variants: {
    variant: {
      online: 'bg-green-500 shadow hover:bg-green-500/80',
      offline: 'bg-destructive shadow hover:bg-destructive/80',
    },
  },
  defaultVariants: {
    variant: 'offline',
  },
});

function Recording() {
  // Get the active device from the device context
  const { user } = useAuth();
  const { activeDevice, hasActiveDevice } = useDeviceState();
  const speechToText = useSpeechToText({ deviceId: activeDevice });
  const { toast } = useToast();

  // Create a new instance of the state machine
  const [current, send] = useMachine(recorderMachine);
  const { value: recordingState } = current;

  const [fileUploadState, setFileUploadState] = useState<{
    isUploading: boolean;
    hasError: boolean;
    message: string | null;
  }>({
    isUploading: false,
    hasError: false,
    message: null,
  });
  const audioElRef = useRef<HTMLAudioElement>(null);

  const uploadFile = async () => {
    setFileUploadState({
      isUploading: true,
      hasError: false,
      message: null,
    });

    const wavBuffer = writeWavHeaders(
      speechToText.recordingInPCM as Int16Array,
      speechToText.channelCount,
    );

    const blob = new Blob([wavBuffer], { type: WAV_MIME_TYPE });

    const { error } = await supabase.storage
      .from('recording')
      .upload(`${user?.id}/${Date.now()}.wav`, blob, {
        cacheControl: '86400', // 1 day
        contentType: WAV_MIME_TYPE,
      });

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
    RECORD: async () => {
      speechToText.start();
    },
    STOP: async () => {
      speechToText.stop();
    },
    START: async () => {
      speechToText.destroy();
      speechToText.start();
    },
    SAVE: async () => {
      uploadFile();
    },
  };

  const handleRecorderAction = (action: RecorderEventType['type']) => {
    send({ type: action });
    recorderActions[action]?.();
  };

  const isTranscribing = useMemo(() => {
    return speechToText.liveStatus && recordingState === 'recording';
  }, [recordingState, speechToText.liveStatus]);

  const selectedDevice = useMemo(() => {
    if (!activeDevice?.length) return undefined;
    return hasActiveDevice(activeDevice) ? activeDevice : undefined;
  }, [activeDevice, hasActiveDevice]);

  useEffect(() => {
    const canvasRef = speechToText.visualizerCanvasRef?.current;
    if (!canvasRef) return;

    const parentRect = canvasRef?.parentElement?.getBoundingClientRect();

    canvasRef.width = parentRect?.width || 300;
    canvasRef.height = parentRect?.height || 300;
  }, [speechToText.visualizerCanvasRef]);

  return (
    <div className="w-full h-[500px] flex justify-center">
      <div className="w-full mt-5 rounded-md border p-2">
        <div className="flex items-start justify-between">
          <div className="w-4/12">
            <DeviceSelect />
          </div>
          <Badge
            className={cn(
              liveBadgeVariants({
                variant: isTranscribing ? 'online' : 'offline',
              }),
              isTranscribing ? 'animate-pulse' : '',
            )}
          >
            {isTranscribing ? 'Transcribing' : 'Speech to Text: Inactive'}
          </Badge>
        </div>

        {selectedDevice ? (
          <>
            <div className="flex justify-center items-center h-[300px]">
              {speechToText.playBackURL ? (
                <audio
                  ref={audioElRef}
                  src={speechToText.playBackURL}
                  controls
                />
              ) : (
                <div className="w-2/4">
                  <canvas ref={speechToText.visualizerCanvasRef} id="canvas" />
                </div>
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

        <div className="mt-5 flex justify-center items-center">
          {isTranscribing &&
            (speechToText.transcript ? (
              <p className="w-1/2 text-sm text-center line-clamp-3">
                {speechToText.transcript}
              </p>
            ) : (
              <div className="w-1/2 flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
