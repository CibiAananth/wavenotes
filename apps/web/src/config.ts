/**
 * Server Config
 */
export const SERVER_PORT = process.env.SERVER_PORT || 3333;
export const SOCKET_ENDPOINT = '/socket';
export const SOCKET_SECRET = process.env.SOCKET_SECRET;
export const SOCKET_CORS_CONFIG = {
  origin: '*',
  methods: ['GET', 'POST'],
};
export const HTTP_CORS_CONFIG = {
  origin: '*',
  optionsSuccessStatus: 200,
  credentials: true,
};

/**
 * Google Cloud Speech-to-Text
 */
export const SAMPLE_RATE = 16000; // in hertz
export const SAMPLE_SIZE = 16; // in bits per linear sample
export const SPEECH_CLIENT_OPTIONS = {
  encoding: 'LINEAR16',
  sampleRateHertz: SAMPLE_RATE,
  languageCode: 'en-US',
  enableWordTimeOffsets: true,
  model: 'latest_long', // medical_dictation
  enableSeparateRecognitionPerChannel: false,
  audioChannelCount: 2,
  enableAutomaticPunctuation: true,
  useEnhanced: true,
};
