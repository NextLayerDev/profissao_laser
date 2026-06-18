import { setupServer } from 'msw/node';

// Servidor MSW compartilhado. Cada teste registra os handlers que precisa com
// `server.use(...)`; sem handler, requests não tratadas falham (onUnhandledRequest: 'error').
export const server = setupServer();
