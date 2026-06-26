import { io } from 'socket.io-client';

const SOCKET_URL = 'https://auto-teller-back-end-production.up.railway.app';

let socket = null;

export function initWebSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function joinCampaignRoom(campaignId) {
  socket?.emit('join-campaign', campaignId);
}

export function subscribeToUserCampaigns(userId) {
  socket?.emit('subscribe-user-campaigns', userId);
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
