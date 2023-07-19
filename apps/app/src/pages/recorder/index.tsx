import { useEffect, useMemo, useRef } from 'react';

import { cva } from 'class-variance-authority';
import { useLocation } from 'react-router-dom';
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

import { DeviceSelect } from './device-select';
import { type RecorderEventType, recorderMachine } from './recorder-machine';

type RecorderActionsType = {
  [K in RecorderEventType['type']]: () => void;
};

export default function _Root() {
  const location = useLocation();

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="mb-10 py-5">
      {location.key !== 'default' && (
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      )}
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
  const { activeDevice, hasActiveDevice } = useDeviceState();
  const speechToText = useSpeechToText({ deviceId: activeDevice });

  // Create a new instance of the state machine
  const [current, send] = useMachine(recorderMachine);
  const { value: recordingState } = current;

  const audioElRef = useRef<HTMLAudioElement>(null);

  const recorderActions: RecorderActionsType = {
    RECORD: async () => {
      console.log('RECORD');
      speechToText.start();
    },
    STOP: async () => {
      console.log('STOP');
      speechToText.stop();
    },
    START: async () => {
      console.log('START');
      speechToText.destroy();
      speechToText.start();
    },
    SAVE: async () => {
      console.log('SAVE');
    },
  };

  const handleRecorderAction = (action: RecorderEventType['type']) => {
    send({ type: action });
    recorderActions[action]?.();
  };

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
      <div className="w-4/6 rounded-md border p-2">
        <div className="w-full  flex items-start justify-between">
          <div className="w-3/6">
            <DeviceSelect />
          </div>
          <Badge
            className={cn(
              liveBadgeVariants({
                variant: speechToText.liveStatus ? 'online' : 'offline',
              }),
              speechToText.liveStatus ? 'animate-pulse' : '',
            )}
          >
            {speechToText.liveStatus
              ? 'Transcribing'
              : 'Speech to Text: Inactive'}
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
                <div className="w-300">
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
                  >
                    <SaveIcon className="mr-2 h-4 w-4" />
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
          {speechToText.liveStatus &&
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

// display: -webkit-box;
// -webkit-line-clamp: 3;
// -webkit-box-orient: vertical;
// text-overflow: ellipsis;
// overflow: hidden;
// width: 400px;
