import {
  useEffect,
  useState,
  type ReactNode,
  useRef,
  useCallback,
} from 'react';
import { Pause, Play } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';

const url =
  'https://wujqkfxwjcdlaqwzqttd.supabase.co/storage/v1/object/sign/recording/7b6a9c24-00b8-466f-a99e-7ca86ec8888d/1689789128340.wav?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJyZWNvcmRpbmcvN2I2YTljMjQtMDBiOC00NjZmLWE5OWUtN2NhODZlYzg4ODhkLzE2ODk3ODkxMjgzNDAud2F2IiwiaWF0IjoxNjg5ODAzNTQ5LCJleHAiOjE2OTA0MDgzNDl9.lYplTk2ZCYRoRJD1YINE4wcJD65xIjEVf_PxiRn4-dY&t=2023-07-19T21%3A52%3A29.681Z';

export const AudioControlCell = (value: any): ReactNode => {
  const rowId = value.row.id;
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const [mediaState, setMediaState] = useState<'playing' | 'paused' | 'idle'>(
    'paused',
  );
  const { activeRowPlayback, setActiveRowPlayback } = value.table.options.meta;

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
        audioElementRef.current.src = url;
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

  return (
    <div className="flex items-center justify-center">
      <Button
        variant="outline"
        className="mr-2"
        onClick={handleMediaStateChange}
      >
        {mediaState === 'playing' ? <Pause /> : <Play />}
      </Button>
    </div>
  );
};
