"use client";

import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

let socket: Socket | null = null;

export const initializeSocket = () => {
  // Only initialize socket on the client
  if (typeof window === 'undefined') {
    return null;
  }
  
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5003';
  
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  
  return socket;
};

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Initialize socket connection
    const socketInstance = initializeSocket();
    
    if (!socketInstance) return;
    
    // Set up event listeners
    const onConnect = () => {
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      setIsConnected(false);
    };
    
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    
    // Set initial connection state
    setIsConnected(socketInstance.connected);
    
    // Clean up event listeners on component unmount
    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
    };
  }, []);
  
  return { socket, isConnected };
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export default socket; 