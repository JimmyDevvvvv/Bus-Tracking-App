// lib/useBusLocation.ts
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useBusLocation(busId: string) {
  const [loc, setLoc] = useState<{latitude:number,longitude:number}|null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!);
    socket.emit('join-bus-room', { busId });
    socket.on('bus-location', data => setLoc(data));
    return () => {
      socket.disconnect();
    };
  }, [busId]);

  return loc;
}
