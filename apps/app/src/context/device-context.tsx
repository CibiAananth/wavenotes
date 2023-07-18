import { createContext, useContext } from 'react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export type DeviceContextType = {
  devices: MediaDeviceInfo[];
  setActiveDevice: Dispatch<SetStateAction<string | null>> | (() => void);
  activeDevice: string | null;
};

export const DeviceContext = createContext<DeviceContextType>({
  devices: [],
  setActiveDevice: () => {
    console.error('set active device function must be overridden');
  },
  activeDevice: null,
});

export function DeviceProvider({
  children,
  kind = 'audioinput',
}: {
  children: React.ReactNode;
  kind?: MediaDeviceKind;
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioInput = devices.filter((device) => device.kind === kind);
      setDevices(audioInput);
    });
  }, [kind, setDevices]);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        setActiveDevice,
        activeDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceState(): DeviceContextType {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error('useDeviceState must be used within a DeviceProvider');
  }

  return context;
}
