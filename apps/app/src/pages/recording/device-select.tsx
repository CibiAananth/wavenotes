import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeviceState } from '@/context/device-context';
import { useMemo } from 'react';

export function DeviceSelect() {
  const { devices, changeDevice, activeDevice, hasActiveDevice } =
    useDeviceState();

  const selectedDevice = useMemo(() => {
    if (!activeDevice?.length) return undefined;
    return hasActiveDevice(activeDevice) ? activeDevice : undefined;
  }, [activeDevice, hasActiveDevice]);

  return (
    <Select value={selectedDevice} onValueChange={changeDevice}>
      <SelectTrigger className="w-[500px]">
        <SelectValue placeholder="Select an input device" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Audio Inputs</SelectLabel>
          {devices.map(device => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
