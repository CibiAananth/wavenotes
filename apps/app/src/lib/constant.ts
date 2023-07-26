export const REC_PREFIX = 'rec-';
export const REC_EXTENSION = '.wav';
export const TRANSCRIPT_PREFIX = 'transc-';
export const TRANSCRIPT_EXTENSION = '.txt';

export const supportedLanguages = [
  {
    label: 'English',
    value: 'en-US',
  },
  {
    label: 'Hindi',
    value: 'hi-IN',
  },
  {
    label: 'Tamil',
    value: 'ta-IN',
  },
  {
    label: 'Kannada',
    value: 'kn-IN',
  },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['value'];
