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
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const middleware_1 = require("../middleware");
const multer_1 = __importDefault(require("multer"));
const db_1 = require("../db");
const crypto_1 = require("crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const client = new client_s3_1.S3Client({
    forcePathStyle: true,
    region: 'ap-south-1',
    endpoint: 'https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/s3',
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
});
function handleRoomPictureUpload(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const bucketName = 'chatbuds';
        // Use default picture if no custom picture is provided
        if (req.body.roomPicture === "groupPP") {
            return `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/${bucketName}/roompictures/roomPP.png`;
        }
        // Handle custom picture upload
        const buffer = (_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer;
        const contentType = (_b = req.file) === null || _b === void 0 ? void 0 : _b.mimetype;
        const extension = contentType === null || contentType === void 0 ? void 0 : contentType.split("/")[1];
        const fileName = `${(0, crypto_1.randomUUID)()}.${extension}`;
        const uploadParams = {
            Bucket: bucketName,
            Key: `roompictures/${fileName}`,
            Body: buffer,
            ContentType: contentType,
            ACL: client_s3_1.ObjectCannedACL.public_read
        };
        yield client.send(new client_s3_1.PutObjectCommand(uploadParams));
        return `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/${bucketName}/roompictures/${fileName}`;
    });
}
const userRouter = (0, express_1.Router)();
const saltRounds = 5;
const JWT_SECRET = process.env.JWT_SECRET;
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
userRouter.post("/signup", upload.single('profilePicture'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, password, username } = req.body;
    if (email === "" || password === "" || username === "" || email === undefined || password === undefined || username === undefined) {
        res.status(406).json({ message: "Enter all details" });
        return;
    }
    try {
        const existingUser = yield db_1.prisma.user.findFirst({
            where: {
                email: email,
                username: username
            }
        });
        if (existingUser) {
            res.status(406).json({ message: "User with this email and username already exists." });
        }
        else {
            const hashPassword = yield bcrypt_1.default.hash(password, saltRounds);
            const userData = { username, email, password: hashPassword };
            let profilePicURL;
            if (req.body.profilePicture !== "userPP") {
                const buffer = (_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer; // Or use file.buffer from multer
                const contentType = (_b = req.file) === null || _b === void 0 ? void 0 : _b.mimetype; // or get from req.file.mimetype
                const extension = contentType === null || contentType === void 0 ? void 0 : contentType.split("/")[1];
                const fileName = `${(0, crypto_1.randomUUID)()}.${extension}`;
                const bucketName = 'chatbuds';
                const uploadParams = {
                    Bucket: bucketName,
                    Key: 'profilepictures/' + fileName,
                    Body: buffer,
                    ContentType: contentType,
                    ACL: client_s3_1.ObjectCannedACL.public_read // Only works if your bucket allows public access
                };
                yield client.send(new client_s3_1.PutObjectCommand(uploadParams));
                console.log('✅ Uploaded successfully');
                // 🔗 Get public URL
                profilePicURL = `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/${bucketName}/profilepictures/${fileName}`;
                console.log('📷 Image URL:', profilePicURL);
            }
            else {
                profilePicURL = `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/chatbuds/profilepictures/userPP.png`;
            }
            const response = yield db_1.prisma.user.create({
                data: {
                    username: username,
                    email,
                    password: hashPassword,
                    profilePicture: profilePicURL
                }
            });
            const token = jsonwebtoken_1.default.sign({
                id: response.id,
                username: response.username,
            }, JWT_SECRET);
            res.status(200).json({ message: "User signed up", token });
        }
    }
    catch (err) {
        res.status(500).json({ message: "Server Error", error: err });
    }
}));
userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    if (password === "" || username === "" || password === undefined || username === undefined) {
        res.status(406).json({ message: "Enter all details" });
        return;
    }
    try {
        const existingUser = yield db_1.prisma.user.findFirst({
            where: {
                username: username
            }
        });
        if (existingUser) {
            const hashedPass = existingUser.password;
            const passwordsMatch = yield bcrypt_1.default.compare(password, hashedPass);
            if (passwordsMatch) {
                const token = jsonwebtoken_1.default.sign({
                    id: existingUser.id,
                    username: username
                }, JWT_SECRET);
                res.status(200).json({ token });
            }
            else {
                res.status(400).json({ message: "Wrong credentials" });
            }
        }
        else {
            res.status(404).json({ message: "User with this username doesn't exist" });
        }
    }
    catch (err) {
        res.status(500).json({ message: "Server Error", error: err });
    }
}));
userRouter.post("/create-room", middleware_1.userMiddleware, upload.single("roomPicture"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, userId } = req;
        const { roomName } = req.body;
        // Generate room picture URL
        const roomPicURL = yield handleRoomPictureUpload(req);
        // Create the room
        const room = yield db_1.prisma.room.create({
            data: {
                name: roomName,
                roomPicture: roomPicURL,
                users: {
                    connect: {
                        id: userId
                    }
                }
            }
        });
        res.status(200).json({ message: "Room created", link: room.id });
        return;
    }
    catch (err) {
        console.error("Error creating room:", err);
        res.status(500).json({ message: "Server Error", error: err });
        return;
    }
}));
userRouter.post("/join-room", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.username;
    const userIdinString = req.userId;
    const roomId = req.body.roomId;
    try {
        // Check if the room exists
        const room = yield db_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { users: true },
        });
        if (!room) {
            res.status(404).json({ message: "Room not found" });
            return;
        }
        // Check if user is already in the room
        const alreadyInRoom = room.users.some((user) => user.id === userIdinString);
        if (alreadyInRoom) {
            res.status(406).json({ message: "You are already in the room" });
            return;
        }
        // Add user to room
        yield db_1.prisma.room.update({
            where: { id: roomId },
            data: {
                users: {
                    connect: { id: userIdinString },
                },
            },
        });
        // Also update user's rooms (optional, since it's the same relation)
        yield db_1.prisma.user.update({
            where: { id: userIdinString },
            data: {
                rooms: {
                    connect: { id: roomId },
                },
            },
        });
        res.status(200).json({ message: "User added to room successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err });
    }
}));
userRouter.get("/info/:room_id", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const room_id = req.params.room_id;
    try {
        const room = yield db_1.prisma.room.findFirst({
            where: {
                id: room_id
            },
            select: {
                id: true,
                name: true,
                roomPicture: true,
                createdAt: true,
                updatedAt: true,
                users: true
            }
        });
        if (room !== null) {
            res.status(200).json({ roomDetails: room });
        }
        else {
            res.status(204).json({ message: "Room not found!" });
        }
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
}));
userRouter.get("/home/userdata", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.username;
    const userId = req.userId;
    const userData = yield db_1.prisma.user.findMany({
        select: {
            password: false,
            email: false,
            id: true,
            username: true,
            profilePicture: true,
            rooms: {
                select: {
                    id: true,
                    name: true,
                    roomPicture: true,
                    createdAt: true,
                    updatedAt: true,
                }
            }
        },
        where: {
            id: userId,
            username
        }
    });
    if (userData[0]) {
        res.status(200).json({ userData: userData[0] });
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
}));
userRouter.get("/home/:roomId", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.username;
    const userId = req.userId;
    const roomId = req.params.roomId;
    const userData = yield db_1.prisma.user.findFirst({
        where: {
            id: userId,
            username: username
        },
        select: {
            username: true,
            rooms: true,
            password: false,
            email: false,
            messages: true
        }
    });
    if (userData !== null) {
        const rooms = userData.rooms;
        const messages = yield db_1.prisma.messages.findMany({
            where: {
                roomId: roomId,
            },
            orderBy: {
                timestamp: 'asc'
            },
            select: {
                id: true,
                roomId: true,
                text: true,
                timestamp: true,
                sender: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true
                    }
                }
            }
        });
        res.status(200).json({ userData: userData, messages });
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
}));
exports.default = userRouter;
