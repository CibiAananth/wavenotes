import { createMachine } from 'xstate';

// Define the events/actions that can occur in the state machine
export type RecorderEventType =
  | { type: 'RECORD' }
  | { type: 'STOP' }
  | { type: 'START' }
  | { type: 'SAVE' };

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
export const recorderMachine = createMachine<
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
