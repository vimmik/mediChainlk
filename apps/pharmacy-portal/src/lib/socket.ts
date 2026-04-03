import { io } from 'socket.io-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const socket = io(`${baseUrl}/ws`, {
  autoConnect: false,
});
