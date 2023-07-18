import { ReactNode, createContext, useContext } from 'react';
import { Dispatch, SetStateAction, useEffect, useState, useRef } from 'react';

export type AudioContextType = object | null;

export const DeviceContext = createContext<AudioContextType>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioEl = useRef<HTMLAudioElement>(null);

  return (
    <DeviceContext.Provider value={null}>{children}</DeviceContext.Provider>
  );
}

export function useAudio(): AudioContextType {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error('useAudio must be used within a AudioProvider');
  }

  return context;
}
