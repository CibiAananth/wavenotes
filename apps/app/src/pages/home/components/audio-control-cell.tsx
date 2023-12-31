import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { FileArrowDown, Pause, Play } from '@phosphor-icons/react';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

import { useAuth } from '@/context/auth-provider';
import { supabase } from '@/lib/supabase';
import { transcriptNameFromWav } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

  const endPlayback = useCallback(() => {
    setMediaState('paused');
    setActiveRowPlayback(null);
  }, [setActiveRowPlayback]);

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
        audioElementRef.current.addEventListener('ended', endPlayback);
      }
      audioElementRef.current?.play();
    }
    if (mediaState === 'paused') {
      audioElementRef.current?.pause();
    }

    return () => {
      audioElementRef.current?.removeEventListener('ended', endPlayback);
    };
  }, [mediaState, endPlayback]);

  const handleMediaStateChange = useCallback(() => {
    if (mediaState === 'playing') {
      setMediaState('paused');
      setActiveRowPlayback(null);
    } else {
      setMediaState('playing');
      setActiveRowPlayback(rowId);
    }
  }, [mediaState, rowId, setActiveRowPlayback]);

  const handleDownloadTranscript = useCallback(async () => {
    const filename = transcriptNameFromWav(row.original.name);
    const { data } = await supabase.storage
      .from('recording')
      .download(`${user?.id}/${filename}`);

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
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [row.original.name, toast, user?.id]);

  const handleDelete = useCallback(async () => {
    const { error } = await supabase.storage
      .from('recording')
      .remove([
        `${user?.id}/${transcriptNameFromWav(row.original.name)}`,
        `${user?.id}/${row.original.name}`,
      ]);

    if (error) {
      toast({
        variant: 'destructive',
        description: 'Something went wrong while deleting this recording.',
      });
      return;
    } else {
      toast({
        variant: 'default',
        description: 'Recording deleted successfully. Please refresh the page',
      });
    }
  }, [row.original.name, toast, user?.id]);

  const handleDownloadRecording = useCallback(async () => {
    const { data } = await supabase.storage
      .from('recording')
      .download(`${user?.id}/${row.original.name}`);

    if (!data) {
      toast({
        variant: 'destructive',
        description: 'Something went wrong while downloading this recording.',
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = row.original.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [row.original.name, toast, user?.id]);

  return (
    <div className="flex items-center justify-center gap-2">
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
            <Button onClick={handleDownloadTranscript} variant="outline">
              <FileArrowDown />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download Transcript</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownloadRecording}>
            Download recording
          </DropdownMenuItem>
          <DropdownMenuItem className="to-red-500" onClick={handleDelete}>
            Delete recording and transcript
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
