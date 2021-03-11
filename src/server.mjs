import express from "express";
import { createServer } from "http";
import { Server as socketio } from "socket.io";

const app = express();
const httpServer = createServer(app);

const io = new socketio(httpServer, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET"]
  }
});

httpServer.listen(3000);
console.log('Listening on port 3000');

io.on('connection', socket => {
  console.log('Player connected!', socket.id);
});