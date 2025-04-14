import { WebSocket } from "ws";
import {createServer} from 'http';
import express from 'express';
import cors from 'cors';
import userRouter from './routes/user';
import { MessageModel, UserModel } from "./db";
import jwt, { decode, JwtPayload } from 'jsonwebtoken';
import 'dotenv/config';
import mongoose, { mongo, ObjectId } from "mongoose";
import { prisma } from "./db";


const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.use(cors());

const server = createServer(app);

const PORT = 10000;

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});
app.use("/", userRouter);


const wss = new WebSocket.Server({ server });


let allSockets = new Map<string, Set<WebSocket>>();

const fetchUserRooms = async (username: string) => {
    const userData = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        rooms: {
          select: {
            id: true,
          },
        },
      },
    });
  
    if (!userData) return null;
  
    return {
      rooms: userData.rooms.map((room) => room.id),
      userId: userData.id,
    };
  };
  

  wss.on("connection", async (socket) => {
    console.log("connected to ws");
  
    socket.on("message", async (message) => {
      const parsedMessage = JSON.parse(message.toString());
  
      if (parsedMessage.type === "join") {
        const token = parsedMessage.payload.token;
  
        try {
          const decoded = jwt.verify(token, JWT_SECRET as string);
          const username = (decoded as any).username;
  
          const data = await fetchUserRooms(username);
          if (!data) {
            socket.close();
            return;
          }
  
          data.rooms.forEach((roomId: string) => {
            if (!allSockets.has(roomId)) {
              allSockets.set(roomId, new Set());
            }
            allSockets.get(roomId)?.add(socket);
          });
  
          // Optionally send ack
          socket.send(JSON.stringify({ type: "joined", rooms: data.rooms }));
        } catch (err) {
          console.error("JWT error:", err);
          socket.close();
        }
      }
  
      else if (parsedMessage.type === "chat") {
        const { roomId, username, userId, msg, profilePicture } = parsedMessage.payload;
  
        const messageToSend = {
          id: crypto.randomUUID(),
          text: msg,
          timestamp: new Date().toISOString(),
          sender: { username, profilePicture, id: userId },
          roomId,
        };
  
        // Broadcast first
        allSockets.get(roomId)?.forEach((s) => {
          if (s.readyState === WebSocket.OPEN) {
            s.send(
              JSON.stringify({
                type: "chat",
                ...messageToSend,
              })
            );
          }
        });
  
        // Persist message in DB
        try {
          await prisma.messages.create({
            data: {
              text: msg,
              timestamp: new Date(),
              sender: { connect: { id: userId } },
              room_id: { connect: { id: roomId } },
            },
          });
        } catch (err) {
          console.error("Failed to save message:", err);
  
          // Send error notification
          allSockets.get(roomId)?.forEach((s) => {
            s.send(
              JSON.stringify({
                type: "error",
                error: "Failed to save message",
              })
            );
          });
        }
      }
    });
  
    socket.on("close", () => {
      console.log("socket closed");
      allSockets.forEach((sockets) => {
        sockets.delete(socket);
      });
    });
  });

server.listen(PORT, () => {
    console.log(" server running on port " + PORT);
});