"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../lib/socket';
import { BusLocation } from '../lib/services';

interface UseSocketTrackProps {
  routeId: string;
}

const useSocketTrack = ({ routeId }: UseSocketTrackProps) => {
  const { socket, isConnected } = useSocket();
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start tracking the bus
  const startTracking = useCallback(() => {
    if (!socket || !isConnected) {
      setError('Socket connection not available');
      return;
    }

    // Join the route room
    socket.emit('join_route', { routeId });
    setIsTracking(true);
    setError(null);
  }, [socket, isConnected, routeId]);

  // Stop tracking the bus
  const stopTracking = useCallback(() => {
    if (!socket || !isConnected) return;

    // Leave the route room
    socket.emit('leave_route', { routeId });
    setIsTracking(false);
    setBusLocation(null);
  }, [socket, isConnected, routeId]);

  useEffect(() => {
    if (!socket) return;

    // Listen for location updates
    const handleLocationUpdate = (data: BusLocation) => {
      if (data.routeId === routeId) {
        setBusLocation(data);
      }
    };

    socket.on('location_update', handleLocationUpdate);

    // Handle errors
    const handleError = (error: { message: string }) => {
      setError(error.message);
      setIsTracking(false);
    };

    socket.on('tracking_error', handleError);

    // Clean up event listeners
    return () => {
      socket.off('location_update', handleLocationUpdate);
      socket.off('tracking_error', handleError);
      
      // Leave route room when unmounting
      if (isTracking) {
        socket.emit('leave_route', { routeId });
      }
    };
  }, [socket, routeId, isTracking]);

  // Auto-start tracking when connected
  useEffect(() => {
    if (isConnected && !isTracking && routeId) {
      startTracking();
    }
  }, [isConnected, isTracking, routeId, startTracking]);

  return {
    busLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
    isConnected
  };
};

export default useSocketTrack; 