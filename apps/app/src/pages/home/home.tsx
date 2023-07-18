import { PlusIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import emptySVG from '@/assets/empty.svg';

import { columns, DataTable, payments } from './recording-table';

export default function Home(): React.ReactNode {
  const data = true;
  return (
    <div>
      <div className="h-[500px] rounded-md border my-10 py-5">
        {data !== true ? (
          <DataTable columns={columns} data={payments} />
        ) : (
          <div className="flex flex-col gap-5 justify-center items-center h-full">
            <img className="w-60 h-auto" src={emptySVG} alt="hero" />
            <h3 className="text-md">Shucks! It is empty</h3>
            <Button>
              <Link className="flex items-center" to="/recording/new">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create a new recording
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
