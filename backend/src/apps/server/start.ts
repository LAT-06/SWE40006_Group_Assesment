import { Server } from './app.js';

const port = process.env.PORT || '3000';
const server = new Server(port);

server.listen();
