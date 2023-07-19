import { useCallback, useRef } from 'react';
import { io, Socket, SocketOptions, ManagerOptions } from 'socket.io-client';

export function useSocket(
  url: string,
  options: Partial<ManagerOptions & SocketOptions> = {},
) {
  const socket = useRef<Socket | null>(null);

  const init = useCallback(() => {
    socket.current = io(url, options);
    socket.current?.on('connect', () => {
      console.log('connected');
    });

    socket.current?.on('disconnect', () => {
      console.log('disconnected');
    });
  }, [url, options]);

  const disconnect = () => {
    socket.current?.disconnect();
    socket.current = null;
  };

  return { instance: socket.current, init, disconnect };
}
