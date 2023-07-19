import { useEffect, useState, type ReactNode, memo } from 'react';
import { Link } from 'react-router-dom';
import { Plus as PlusIcon } from '@phosphor-icons/react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-provider';

import emptySVG from '@/assets/empty.svg';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RecordingTable } from './recording-table';

const TableSkeleton = memo(() => {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full h-fit flex gap-12">
        <div className="w-full h-fit flex flex-col gap-5">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
        <div className="w-full h-fit flex flex-col gap-5">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
        <div className="w-full h-fit flex flex-col gap-5">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
      </div>
    </div>
  );
});

async function fetchUserRecordings(userId: string | undefined) {
  // return new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     resolve(null);
  //   }, 2000);
  // });

  if (!userId) {
    return;
  }

  const { data, error } = await supabase.storage
    .from('recording')
    .list(userId, {
      limit: 20,
      sortBy: {
        column: 'created_at',
        order: 'desc',
      },
    });
  if (error) {
    throw error;
  }
  console.log('data', data);

  return data;
}

type RequestStateType = {
  isFetching: boolean;
  hasError: boolean;
  message: string | null;
};

export default function Home(): ReactNode {
  const { user } = useAuth();
  const [requestState, setRequestState] = useState<RequestStateType>({
    isFetching: false,
    hasError: false,
    message: null,
  });
  const [recordings, setRecordings] = useState<any[] | undefined>([]);

  useEffect(() => {
    (async () => {
      try {
        setRequestState({
          isFetching: true,
          hasError: false,
          message: null,
        });
        const data = await fetchUserRecordings(user?.id);
        setRecordings(data);
      } catch (error) {
        console.log('error', error);
        setRequestState({
          isFetching: false,
          hasError: true,
          message: error as string,
        });
      } finally {
        setRequestState(prev => ({ ...prev, isFetching: false }));
      }
    })();
  }, [user]);

  return (
    <div className="border h-[550px] p-6 mt-4 rounded-md">
      {requestState.isFetching && (
        <div className="h-[200] w-full flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-[20px] w-[210px]" />
            <Skeleton className="h-[36px] w-[210px] ml-auto" />
          </div>
          <div className="rounded-md border">
            <TableSkeleton />
          </div>
        </div>
      )}

      {!requestState.isFetching && !recordings?.length && (
        <div className="flex flex-col gap-5 justify-center items-center h-full">
          <img className="w-60 h-auto" src={emptySVG} alt="hero" />
          <h3 className="text-md">Shucks! It is empty</h3>
          <Link to="/recording/new">
            <Button className="ml-auto">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create new recording
            </Button>
          </Link>
        </div>
      )}

      {!requestState.isFetching &&
        !requestState.hasError &&
        recordings?.length && (
          <>
            <div className="flex justify-between items-center">
              <h3>Your recordings ({recordings?.length})</h3>
              <Link to="/recording/new">
                <Button className="ml-auto">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create new recording
                </Button>
              </Link>
            </div>
            <div className="mt-3">
              <RecordingTable data={recordings} />
              <p className="text-muted-foreground text-xs mt-5 font-light">
                Showing only the latest 10 recordings available.
              </p>
            </div>
          </>
        )}
    </div>
  );
}
