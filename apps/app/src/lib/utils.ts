import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 *
 * @param bytes  bytes to convert to a human readable format
 * @returns A string representing the set of bytes in a human readable format
 *
 * @example
 * bytesToReadableString(1024) // 1 KB
 * bytesToReadableString(1024 * 1024) // 1 MB
 * bytesToReadableString(1024 * 1024 * 1024) // 1 GB
 * bytesToReadableString(1024 * 1024 * 1024 * 1024) // 1 TB
 */
export function bytesToReadableString(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}
