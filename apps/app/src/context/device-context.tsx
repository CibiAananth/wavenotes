import { createContext, useContext } from 'react';
import { useEffect, useState } from 'react';

export type DeviceContextType = {
  devices: MediaDeviceInfo[];
  changeDevice: (deviceId: string | null) => void;
  hasActiveDevice: (deviceId: string | null) => boolean;
  activeDevice: string | null;
};

export const DeviceContext = createContext<DeviceContextType>({
  devices: [],
  changeDevice: () => {
    console.error('changeDevice function must be overridden');
  },
  hasActiveDevice: () => {
    return false;
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
    const persistedDeviceId = window.localStorage.getItem('deviceId');
    setActiveDevice(persistedDeviceId);
  }, []);

  function changeDevice(deviceId: string | null) {
    window.localStorage.setItem('deviceId', deviceId || '');
    setActiveDevice(deviceId);
  }

  function hasActiveDevice(deviceId: string | null): boolean {
    if (!deviceId) return false;
    return devices.some(device => device.deviceId === deviceId);
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const audioInput = devices.filter(device => device.kind === kind);
      setDevices(audioInput);
    });
  }, [kind, setDevices]);

  return (
    <DeviceContext.Provider
      value={{
        activeDevice,
        devices,
        changeDevice,
        hasActiveDevice,
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
