import { memo, useMemo, type ReactNode } from 'react';

import { useDeviceState } from '@/context/device-provider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const DeviceSelect = memo(
  ({ disabled = false }: { disabled: boolean }): ReactNode => {
    const { devices, changeDevice, activeDevice, hasActiveDevice } =
      useDeviceState();

    const selectedDevice = useMemo(() => {
      if (!activeDevice?.length) return undefined;
      return hasActiveDevice(activeDevice) ? activeDevice : undefined;
    }, [activeDevice, hasActiveDevice]);

    return (
      <Select
        disabled={disabled}
        value={selectedDevice}
        onValueChange={changeDevice}
      >
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
  },
);
