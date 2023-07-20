'use strict';

import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import winston from 'winston';

import * as config from './config';
import apiRoutes from './routes/api';
import intiSocketServer from './socket-server';

const app = express();

winston.configure({
  transports: [new winston.transports.Console()],
});

/**
 * Configure middleware
 */
app.use(
  cors({
    // origin: `http://localhost:${config.SERVER_PORT}`,
    origin: function (origin, callback) {
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true,
  }),
  cookieParser(),
  bodyParser.json(),
);

/**
 * Include all API Routes
 */
app.use('/api', apiRoutes);

// Create a HTTP server
const httpServer = http.createServer({}, app);
httpServer.listen(config.SERVER_PORT, () => {
  winston.info(`listening on port ${config.SERVER_PORT}`);
});

/**
 * Socket.io section
 */
intiSocketServer(httpServer);
