import { memo } from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const liveBadgeVariants = cva('bg-primary', {
  variants: {
    variant: {
      online: 'bg-green-500 shadow hover:bg-green-500/80',
      offline: 'bg-destructive shadow hover:bg-destructive/80',
    },
  },
  defaultVariants: {
    variant: 'offline',
  },
});

const LiveBadge = memo(({ isLive }: { isLive: boolean }) => (
  <Badge
    className={cn(
      liveBadgeVariants({
        variant: isLive ? 'online' : 'offline',
      }),
      isLive ? 'animate-pulse' : '',
    )}
  >
    {isLive ? 'Transcribing' : 'Speech to Text: Inactive'}
  </Badge>
));

export default LiveBadge;
