'use strict';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ debug: true });

import express from 'express';
import http from 'http';
import cors from 'cors';
import winston from 'winston';

import * as config from './config';
import apiRoutes from './routes/api';
import intiSocketServer from './socket/server';

const app = express();

winston.configure({
  transports: [new winston.transports.Console()],
});

/**
 * Configure middleware
 */
app.use(cors(config.HTTP_CORS_CONFIG));

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
