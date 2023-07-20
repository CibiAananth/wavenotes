import {
  useEffect,
  useState,
  type ReactNode,
  useRef,
  useCallback,
} from 'react';
import { FileArrowDown, Pause, Play } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/components/ui/use-toast';

export const AudioControlCell = ({
  row,
  table,
}: {
  row: any;
  table: any;
}): ReactNode => {
  const { user } = useAuth();
  const { toast } = useToast();

  const rowId = row.id;
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [mediaState, setMediaState] = useState<'playing' | 'paused' | 'idle'>(
    'paused',
  );
  const { activeRowPlayback, setActiveRowPlayback } = table.options.meta;

  useEffect(() => {
    if (activeRowPlayback !== rowId) {
      audioElementRef.current?.pause();
      audioElementRef.current?.remove();
      audioElementRef.current = null;
      setMediaState('paused');
    }
  }, [activeRowPlayback, rowId]);

  useEffect(() => {
    if (mediaState === 'playing') {
      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement('audio');
        audioElementRef.current.src = row.original.signedURL;
      }
      audioElementRef.current?.play();
    }
    if (mediaState === 'paused') {
      audioElementRef.current?.pause();
    }
  }, [mediaState]);

  const handleMediaStateChange = useCallback(() => {
    if (mediaState === 'playing') {
      setMediaState('paused');
      setActiveRowPlayback(null);
    } else {
      setMediaState('playing');
      setActiveRowPlayback(rowId);
    }
  }, [mediaState, rowId, setActiveRowPlayback]);

  const handleTranscriptDownload = useCallback(async () => {
    const { data } = await supabase.storage
      .from('recording')
      .download(`${user?.id}/${row.original.name.split('.wav')[0]}.txt`);

    if (!data) {
      toast({
        variant: 'destructive',
        description: 'No transcript found for this recording.',
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${row.original.name.split('.wav')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [row.original.name, user]);

  return (
    <div className="flex items-center justify-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="mr-2"
              onClick={handleMediaStateChange}
            >
              {mediaState === 'playing' ? <Pause /> : <Play />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{`${mediaState === 'playing' ? 'Pause' : 'Play'} Audio`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleTranscriptDownload} variant="outline">
              <FileArrowDown />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download Transcript</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
