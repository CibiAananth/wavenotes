/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';
import express from 'express';
import http from 'http';
import { writeWavHeader } from './util';
import { SAMPLE_RATE, SAMPLE_SIZE } from './config';

const app = express();
const server = http.createServer(app);

const socketio = require('socket.io');
const io = socketio(server, {
  path: '/custom/',
  cors: {
    origin: '*',
  },
});

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech').v1;
// Creates a client
const client = new speech.SpeechClient();

const config = {
  encoding: 'LINEAR16',
  sampleRateHertz: SAMPLE_RATE,
  languageCode: 'en-US',
  enableWordTimeOffsets: true,
  model: 'medical_dictation',
  audioChannelCount: 2,
  enableSeparateRecognitionPerChannel: true,
};

const filePath = path.join(__dirname, 'audio.wav');

io.on('connection', socket => {
  const recognizeStream = client
    .streamingRecognize({
      config,
      interimResults: true,
    })
    .on('error', console.error)
    .on('data', data => {
      console.log('data', data.results[0]?.alternatives[0]);
      io.emit('transcript', data.results[0]?.alternatives[0].transcript);
    });

  console.log('New client connected');

  /**
   * Using buffer and allocating memory
   */
  let pcmBuffer = Buffer.alloc(0);
  socket.on('pcmChunk', (data: Buffer) => {
    recognizeStream.write(data);
    pcmBuffer = Buffer.concat([pcmBuffer, data]);
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected');
    try {
      console.log('Client disconnected');
      const wavHeader = writeWavHeader(
        SAMPLE_RATE,
        2,
        SAMPLE_SIZE,
        pcmBuffer.length / 2,
      );
      const wavData = Buffer.concat([wavHeader, pcmBuffer]);
      fs.writeFileSync(filePath, wavData);
      console.log('filePath', filePath);
      pcmBuffer = Buffer.alloc(0);

      const audio = {
        content: fs.readFileSync(filePath).toString('base64'),
      };

      const request = {
        config: config,
        audio: audio,
      };
      const [response] = await client.recognize(request);
      response.results.forEach(result => {
        const alternative = result.alternatives[0];
        console.log('result', alternative?.transcript);
      });
    } catch (e) {
      console.log(e);
    } finally {
      recognizeStream.destroy();
      recognizeStream.removeAllListeners();
    }
  });
});

app.get('/api', (_req, res) => {
  res.send({ message: 'Welcome to web!' });
});

server.listen(3333, () => {
  console.log('Listening at http://localhost:3333/api');
});

server.on('error', console.error);
