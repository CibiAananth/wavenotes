import { useMemo, type ReactNode, memo } from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeviceState } from '@/context/device-provider';

export const DeviceSelect = memo((): ReactNode => {
  const { devices, changeDevice, activeDevice, hasActiveDevice } =
    useDeviceState();

  const selectedDevice = useMemo(() => {
    if (!activeDevice?.length) return undefined;
    return hasActiveDevice(activeDevice) ? activeDevice : undefined;
  }, [activeDevice, hasActiveDevice]);

  return (
    <Select value={selectedDevice} onValueChange={changeDevice}>
      <SelectTrigger>
        <SelectValue placeholder="Select an input device" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {devices.map(device => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});
