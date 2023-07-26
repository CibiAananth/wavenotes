/**
 * Server Config
 */
export const SERVER_PORT = process.env.NX_SERVER_PORT || 3331;
export const SOCKET_ENDPOINT = process.env.NX_SOCKET_ENDPOINT || '/socket';
export const SOCKET_SECRET = process.env.NX_SOCKET_SECRET;
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
export const DEFAULT_SAMPLE_RATE = 16000; // in hertz
export const DEFAULT_SAMPLE_SIZE = 16;
export const DEFAULT_CHANNEL_COUNT = 1;
export const SPEECH_CLIENT_OPTIONS = {
  encoding: 'LINEAR16',
  sampleRateHertz: DEFAULT_SAMPLE_RATE,
  languageCode: 'en-US',
  enableWordTimeOffsets: true,
  model: 'latest_long', // medical_dictation
  enableSeparateRecognitionPerChannel: false,
  audioChannelCount: DEFAULT_CHANNEL_COUNT,
  enableAutomaticPunctuation: true,
  useEnhanced: true,
};
