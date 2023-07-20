import { useState } from 'react';
import {
  ColumnDef,
  TableOptions,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AudioControlCell } from './audio-control-cell';

import { bytesToReadableString } from '@/lib/utils';

export type MetadataType = {
  eTag: string;
  size: number;
  mimetype: string;
  cacheControl: string;
  lastModified: string;
  contentLength: number;
  httpStatusCode: number;
};

export type FileType = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  signedURL: string;
  metadata: MetadataType;
};

export type Recording = FileType & {
  metadata: MetadataType;
};

const columns: ColumnDef<Recording>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: value => {
      return new Date(value.getValue() as Date).toLocaleString();
    },
  },
  {
    accessorKey: 'metadata.size',
    header: 'Size',
    cell: value => bytesToReadableString(value.getValue() as number),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: AudioControlCell,
  },
];

export function RecordingTable({ data }: { data: Recording[] }) {
  const [activeRowPlayback, setActiveRowPlayback] = useState<
    string | number | null
  >(null);

  const tableOptions: TableOptions<Recording> = {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      activeRowPlayback,
      setActiveRowPlayback,
    },
  };

  const table = useReactTable<Recording>(tableOptions);

  return (
    <div className="h-full rounded-md border">
      <div className="h-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
