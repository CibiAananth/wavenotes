import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export const useDevice = (
  kind: MediaDeviceKind = 'audioinput'
): {
  devices: MediaDeviceInfo[];
  setActiveDevice: Dispatch<SetStateAction<string | null>>;
  activeDevice: string | null;
} => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioInput = devices.filter((device) => device.kind === kind);
      setDevices(audioInput);
    });
  }, [kind, setDevices]);

  return { devices, setActiveDevice, activeDevice };
};
