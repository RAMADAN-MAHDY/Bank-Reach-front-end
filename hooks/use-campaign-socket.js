'use client';

import { useEffect } from 'react';
import { initWebSocket, joinCampaignRoom } from '@/lib/socket';

export function useCampaignSocket({ onUpdate, onStats } = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = initWebSocket(token);

    const handleUpdate = (data) => onUpdate?.(data);
    const handleStats  = (data) => onStats?.(data);

    socket.on('campaign-update',        handleUpdate);
    socket.on('campaign-global-update', handleUpdate);
    socket.on('campaign-stats',         handleStats);

    return () => {
      socket.off('campaign-update',        handleUpdate);
      socket.off('campaign-global-update', handleUpdate);
      socket.off('campaign-stats',         handleStats);
    };
  }, []);

  return { joinCampaignRoom };
}
