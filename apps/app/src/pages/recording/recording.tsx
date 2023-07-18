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
import { useRef } from 'react';

// Define the events/actions that can occur in the state machine
type RecorderEventType =
  | { type: 'RECORD' }
  | { type: 'STOP' }
  | { type: 'PAUSE' }
  | { type: 'PLAY' }
  | { type: 'RESUME' };

type RecorderActionsType = {
  [K in RecorderEventType['type']]: () => void;
};

// Define the context (extended state)
type RecorderContextType = object;

// Define the type of the state value
export type RecorderStateType =
  | { value: 'idle'; context: RecorderContextType }
  | { value: 'recording'; context: RecorderContextType }
  | { value: 'stopped'; context: RecorderContextType }
  | { value: 'playing'; context: RecorderContextType }
  | { value: 'paused'; context: RecorderContextType };

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
        PAUSE: 'paused',
      },
    },
    stopped: {
      on: {
        PLAY: 'playing',
        RECORD: 'recording',
      },
    },
    playing: {
      on: {
        STOP: 'stopped',
        PAUSE: 'paused',
      },
    },
    paused: {
      on: {
        RESUME: 'recording',
        STOP: 'stopped',
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
  const { activeDevice } = useDeviceState();
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
    PAUSE: () => {
      console.log('PAUSE');
    },
    PLAY: async () => {
      console.log('PLAY');
      // if (!audioElRef.current) return;
      // console.log(textToSpeech.getPlayBackURL());

      // audioElRef.current.src = textToSpeech.getPlayBackURL() as string;
      // audioElRef.current.play();
    },
    RESUME: () => {
      console.log('RESUME');
    },
  };

  const handleRecorderAction = (action: RecorderEventType['type']) => {
    send({ type: action });
    recorderActions[action]?.();
  };

  return (
    <div className="w-full h-[500px] my-10 py-5 flex justify-center">
      <div className="w-4/6 rounded-md border p-2">
        <DeviceSelect />
        <audio ref={audioElRef} src={textToSpeech.playBackURL} controls />

        {activeDevice ? (
          <div>
            {recordingState === 'idle' && (
              <Button onClick={() => handleRecorderAction('RECORD')}>
                <MicIcon className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            )}
            {recordingState === 'recording' && (
              <>
                <Button onClick={() => handleRecorderAction('STOP')}>
                  <StopIcon className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRecorderAction('PAUSE')}
                >
                  <PauseIcon className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              </>
            )}
            {recordingState === 'stopped' && (
              <>
                <Button onClick={() => handleRecorderAction('RECORD')}>
                  <MicIcon className="mr-2 h-4 w-4" />
                  Start new Recording
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRecorderAction('PLAY')}
                >
                  <PlayIcon className="mr-2 h-4 w-4" />
                  Play
                </Button>
              </>
            )}
            {recordingState === 'playing' && (
              <>
                <Button onClick={() => handleRecorderAction('STOP')}>
                  <StopIcon className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRecorderAction('PAUSE')}
                >
                  <PauseIcon className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              </>
            )}
            {recordingState === 'paused' && (
              <>
                <Button onClick={() => handleRecorderAction('STOP')}>
                  <StopIcon className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button onClick={() => handleRecorderAction('RESUME')}>
                  <PlayIcon className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              </>
            )}
          </div>
        ) : (
          <p className="text-center flex self-center items-center justify-center">
            Please select the Microphone to start recording
          </p>
        )}
      </div>
    </div>
  );
}
