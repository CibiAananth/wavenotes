import { SOCKET_SECRET } from '../config';
import winston from 'winston';
const socketAuthMiddleware = (socket, next) => {
  /**
   * @todo
   * 1. Validate token
   * 2. If token is valid, attach user to socket
   * 3. If token is invalid, return error
   * 4. If token is not provided, return error
   * 5. If token is valid, but user is not found, return error
   *
   * @description
   * A very simple implementation of socket authentication.
   * Replace this with JWT authentication or any other authentication
   */

  const isValidToken =
    socket.handshake.query?.token?.trim() === SOCKET_SECRET.trim();
  if (!isValidToken) {
    const message = 'NOT AUTHORIZED';
    winston.error(message, socket.handshake.query);
    socket.conn.close(); // Manually disconnect the socket
  } else {
    return next();
  }
};

export default socketAuthMiddleware;
