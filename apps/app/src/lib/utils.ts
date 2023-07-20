import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  REC_PREFIX,
  REC_EXTENSION,
  TRANSCRIPT_PREFIX,
  TRANSCRIPT_EXTENSION,
} from './constant';

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
/**
 *
 * @param name recording file name to convert to a transcript file name
 * @returns A string representing the transcript file name
 * @example
 * transcriptNameFromWav('rec-1326834.wav') // transc-1326834.txt
 * transcriptNameFromWav('rec-9718634.wav') // transc-9718634.txt
 * transcriptNameFromWav('rec-1324994.wav') // transc-1324994.txt
 */
export function transcriptNameFromWav(name: string) {
  const regex = new RegExp(`${REC_PREFIX}(.*?)${REC_EXTENSION}`);
  return name.replace(regex, `${TRANSCRIPT_PREFIX}$1${TRANSCRIPT_EXTENSION}`);
}
