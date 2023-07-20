import winston from 'winston';

import socketAuthMiddleware from '../middleware/socket-auth';
import {
  SOCKET_CORS_CONFIG,
  SOCKET_ENDPOINT,
  SPEECH_CLIENT_OPTIONS,
} from '../config';

function init(httpServer) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const speech = require('@google-cloud/speech').v1;
  const speechClient = new speech.SpeechClient();

  const connectionMap = new Map();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const io = require('socket.io')(httpServer, {
    cors: SOCKET_CORS_CONFIG,
    path: SOCKET_ENDPOINT,
  });

  io.use(socketAuthMiddleware);

  io.on('connection', socket => {
    /**
     * Adding new client to the map
     */
    winston.info(`New connection: ${socket.id}`);
    connectionMap.set(socket.id, {
      socketId: socket.id,
      sessions: {},
    });

    /**
     * Creating recognition stream
     */
    let recognitionStream;

    /**
     * Using buffer and allocating memory
     */
    socket.on('speech.chunks.pcm.session.start', data => {
      winston.info(`session start: ${data.id}`);

      recognitionStream = speechClient
        .streamingRecognize({
          config: {
            ...SPEECH_CLIENT_OPTIONS,
          },
          interimResults: true,
        })
        .on('error', console.error)
        .on('data', data => {
          socket.emit('speech.chunks.pcm.transcript', {
            sessionId: data.id, // attach the session ID
            data: data,
          });
        });

      connectionMap.get(socket.id).sessions[data.id] = {
        recognitionStream: recognitionStream,
        pcmBuffer: Buffer.alloc(0),
      };
    });

    socket.on('speech.chunks.pcm.recognize', data => {
      winston.info(`pcmChunk: ${data.id}`);

      const session = connectionMap.get(socket.id).sessions[data.id];
      if (session) {
        session.recognitionStream.write(data.pcmChunk);
        session.pcmBuffer = Buffer.concat([session.pcmBuffer, data.pcmChunk]);
      }
    });

    socket.on('speech.chunks.pcm.session.end', data => {
      winston.info(`session end: ${data.id}`);

      const session = connectionMap.get(socket.id).sessions[data.id];
      if (session) {
        session.recognitionStream.end();
        session.recognitionStream.destroy();
        session.recognitionStream.removeAllListeners();
        session.pcmBuffer = Buffer.alloc(0);
      }
    });

    socket.on('disconnect', () => {
      winston.info(`Connection left (${socket.id})`);
      connectionMap.delete(socket.id);
    });
  });

  return { io, connectionMap };
}

export default init;
