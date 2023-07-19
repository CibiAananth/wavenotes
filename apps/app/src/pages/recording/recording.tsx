import { useMachine } from '@xstate/react';
import { createMachine } from 'xstate';

import {
  Microphone as MicIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { DeviceSelect } from './device-select';
import { DeviceProvider, useDeviceState } from '@/context/device-context';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useMemo, useRef } from 'react';

// Define the events/actions that can occur in the state machine
type RecorderEventType =
  | { type: 'RECORD' }
  | { type: 'STOP' }
  | { type: 'START' };

type RecorderActionsType = {
  [K in RecorderEventType['type']]: () => void;
};

// Define the context (extended state)
type RecorderContextType = object;

// Define the type of the state value
export type RecorderStateType =
  | { value: 'idle'; context: RecorderContextType }
  | { value: 'recording'; context: RecorderContextType }
  | { value: 'stopped'; context: RecorderContextType };

// Define the state schema
const schema = {
  context: {},
  events: {} as RecorderEventType,
};

// Define the state machine
const recorderMachine = createMachine<
  RecorderContextType,
  RecorderEventType,
  RecorderStateType
>({
  id: 'recorder',
  initial: 'idle',
  schema,
  states: {
    idle: {
      on: {
        RECORD: 'recording',
      },
    },
    recording: {
      on: {
        STOP: 'stopped',
      },
    },
    stopped: {
      on: {
        START: 'recording',
      },
    },
  },
});

export default function _Root() {
  return (
    <DeviceProvider>
      <Recording />
    </DeviceProvider>
  );
}

function Recording() {
  // Get the active device from the device context
  const { activeDevice, hasActiveDevice } = useDeviceState();
  const textToSpeech = useSpeechToText({ deviceId: activeDevice });

  // Create a new instance of the state machine
  const [current, send] = useMachine(recorderMachine);
  const { value: recordingState } = current;

  const audioElRef = useRef<HTMLAudioElement>(null);

  const recorderActions: RecorderActionsType = {
    RECORD: async () => {
      console.log('RECORD');
      textToSpeech.start();
    },
    STOP: async () => {
      console.log('STOP');
      textToSpeech.stop();
    },
    START: async () => {
      console.log('START');
      textToSpeech.destroy();
      textToSpeech.start();
    },
    // PLAY: async () => {
    //   console.log('PLAY');
    // },
  };

  const handleRecorderAction = (action: RecorderEventType['type']) => {
    send({ type: action });
    recorderActions[action]?.();
  };

  const selectedDevice = useMemo(() => {
    if (!activeDevice?.length) return undefined;
    return hasActiveDevice(activeDevice) ? activeDevice : undefined;
  }, [activeDevice, hasActiveDevice]);

  return (
    <div className="w-full h-[500px] my-10 py-5 flex justify-center">
      <div className="w-4/6 rounded-md border p-2">
        <DeviceSelect />
        <audio ref={audioElRef} src={textToSpeech.playBackURL} controls />

        {selectedDevice ? (
          <div>
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
              <Button onClick={() => handleRecorderAction('START')}>
                <MicIcon className="mr-2 h-4 w-4" />
                Start New Recording
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center flex self-center items-center justify-center">
            Please allow Microphone access and select the input device to start
            recording
          </p>
        )}

        {textToSpeech.transcript && (
          <div className="mt-5">
            <h3 className="text-lg font-semibold">Transcript</h3>
            <p className="text-sm">{textToSpeech.transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
}
