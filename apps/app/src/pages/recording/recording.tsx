import { Button } from '@/components/ui/button';
import { Microphone } from '@phosphor-icons/react';

export default function Recording(): React.ReactNode {
  return (
    <div className="container h-[700px] rounded-md border my-10 py-5">
      <Button>
        <Microphone className="mr-2 h-4 w-4" />
        Start Recording
      </Button>
    </div>
  );
}
