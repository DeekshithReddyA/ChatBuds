"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const user_1 = __importDefault(require("./routes/user"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const db_1 = require("./db");
const JWT_SECRET = process.env.JWT_SECRET;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = (0, http_1.createServer)(app);
const PORT = 10000;
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});
app.use("/", user_1.default);
const wss = new ws_1.WebSocket.Server({ server });
let allSockets = new Map();
const fetchUserRooms = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield db_1.prisma.user.findUnique({
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
    if (!userData)
        return null;
    return {
        rooms: userData.rooms.map((room) => room.id),
        userId: userData.id,
    };
});
wss.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("connected to ws");
    socket.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.type === "join") {
            const token = parsedMessage.payload.token;
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                const username = decoded.username;
                const data = yield fetchUserRooms(username);
                if (!data) {
                    socket.close();
                    return;
                }
                data.rooms.forEach((roomId) => {
                    var _a;
                    if (!allSockets.has(roomId)) {
                        allSockets.set(roomId, new Set());
                    }
                    (_a = allSockets.get(roomId)) === null || _a === void 0 ? void 0 : _a.add(socket);
                });
                // Optionally send ack
                socket.send(JSON.stringify({ type: "joined", rooms: data.rooms }));
            }
            catch (err) {
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
            (_a = allSockets.get(roomId)) === null || _a === void 0 ? void 0 : _a.forEach((s) => {
                if (s.readyState === ws_1.WebSocket.OPEN) {
                    s.send(JSON.stringify(Object.assign({ type: "chat" }, messageToSend)));
                }
            });
            // Persist message in DB
            try {
                yield db_1.prisma.messages.create({
                    data: {
                        text: msg,
                        timestamp: new Date(),
                        sender: { connect: { id: userId } },
                        room_id: { connect: { id: roomId } },
                    },
                });
            }
            catch (err) {
                console.error("Failed to save message:", err);
                // Send error notification
                (_b = allSockets.get(roomId)) === null || _b === void 0 ? void 0 : _b.forEach((s) => {
                    s.send(JSON.stringify({
                        type: "error",
                        error: "Failed to save message",
                    }));
                });
            }
        }
    }));
    socket.on("close", () => {
        console.log("socket closed");
        allSockets.forEach((sockets) => {
            sockets.delete(socket);
        });
    });
}));
server.listen(PORT, () => {
    console.log(" server running on port " + PORT);
});
