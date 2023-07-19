import { useCallback, useRef, useEffect } from 'react';
import { io, Socket, SocketOptions, ManagerOptions } from 'socket.io-client';

export function useSocket(
  url: string,
  options: Partial<ManagerOptions & SocketOptions> = {},
) {
  const socket = useRef<Socket | null>(null);

  const init = useCallback(() => {
    console.log('initing', url, options);
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

  useEffect(() => {
    return () => {
      console.log('disconnecting sockets');
      disconnect();
    };
  }, []);

  return { instance: socket.current, init, disconnect };
}
