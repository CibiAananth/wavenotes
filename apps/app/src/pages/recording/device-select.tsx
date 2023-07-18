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

export function DeviceSelect() {
  const { devices, setActiveDevice } = useDeviceState();

  const handleDeviceChange = (deviceId: string) => {
    setActiveDevice(deviceId);
  };

  return (
    <Select onValueChange={handleDeviceChange}>
      <SelectTrigger className="w-[500px]">
        <SelectValue placeholder="Select an input device" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Audio Inputs</SelectLabel>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
