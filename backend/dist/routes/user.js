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
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const middleware_1 = require("../middleware");
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const db_2 = require("../db");
const crypto_2 = require("crypto");
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
        const fileName = `${(0, crypto_2.randomUUID)()}.${extension}`;
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
    console.log("req", req.body);
    if (email === "" || password === "" || username === "" || email === undefined || password === undefined || username === undefined) {
        res.status(406).json({ message: "Enter all details" });
        return;
    }
    try {
        const existingUser = yield db_2.prisma.user.findFirst({
            where: {
                email: email,
                username: username
            }
        });
        console.log(existingUser);
        // const existingUser = await UserModel.findOne({email : email , username : username});
        if (existingUser) {
            res.status(406).json({ message: "User with this email and username already exists." });
        }
        else {
            const hashPassword = yield bcrypt_1.default.hash(password, saltRounds);
            const userData = { username, email, password: hashPassword };
            console.log(req.file);
            let profilePicURL;
            if (req.body.profilePicture !== "userPP") {
                const buffer = (_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer; // Or use file.buffer from multer
                const contentType = (_b = req.file) === null || _b === void 0 ? void 0 : _b.mimetype; // or get from req.file.mimetype
                const extension = contentType === null || contentType === void 0 ? void 0 : contentType.split("/")[1];
                const fileName = `${(0, crypto_2.randomUUID)()}.${extension}`;
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
            const response = yield db_2.prisma.user.create({
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
        const existingUser = yield db_2.prisma.user.findFirst({
            where: {
                username: username
            }
        });
        // const existingUser: any = await UserModel.findOne({username});
        console.log(existingUser);
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
        const roomId = crypto_1.default.randomUUID();
        // Check if room already exists (though UUID collision is extremely unlikely)
        const roomExists = yield db_2.prisma.room.findFirst({
            where: { roomId }
        });
        if (roomExists) {
            res.status(400).json({ message: "There was a problem! Please try again" });
            return;
        }
        // Generate room picture URL
        const roomPicURL = yield handleRoomPictureUpload(req);
        // Create the room
        const room = yield db_2.prisma.room.create({
            data: {
                name: roomName,
                roomId,
                roomPicture: roomPicURL,
                users: {
                    connect: {
                        id: userId
                    }
                }
            }
        });
        //   // Update user's rooms
        //   const userData = await prisma.user.findFirst({
        //       select: {
        //         rooms: true,
        //         id: true,
        //         username: true,
        //         profilePicture: true,
        //     },
        //     where: { username }
        // });
        // if (!userData) {
        //     res.status(404).json({ message: "User not found" });
        //     return;
        // }
        // const rooms = userData.rooms || [];
        // rooms.push(room);
        // await prisma.user.update({
        //     where: { username: userData.username },
        //     data: { rooms }
        // });
        res.status(200).json({ message: "Room created", link: roomId });
        return;
    }
    catch (err) {
        console.error("Error creating room:", err);
        res.status(500).json({ message: "Server Error", error: err });
        return;
    }
}));
/**
 * Handles uploading room picture to storage
 * @param req - Express request object
 * @returns URL of the uploaded image
 */
// userRouter.post("/create-room", userMiddleware, upload.single("roomPicture"), async (req, res) => {
//     console.log("Create room endpoint");
//     console.log("req", req.body);
//     const username: string = req.username
//     const userId: string = req.userId;
//     const roomName: string = req.body.roomName;
//     const roomId: string = crypto.randomUUID();
//     // const userId: ObjectId = new mongoose.Types.ObjectId(userIdInString);
//     try {
//         // const roomExists = await RoomModel.findOne({roomId});
//         const roomExists1 = await prisma.room.findFirst({
//             where: {
//                 roomId: roomId
//             }
//         });
//         console.log("hmm", roomExists1);
//         let roomPicURL;
//         const roomData: RoomDataType = { roomId, name: roomName, users: [userId] };
//         if (roomExists1) {
//             res.status(400).json({ message: "There was a problem! Please try again" });
//         } else {
//             if (req.body.roomPicture !== "groupPP") {
//                 // roomData.roomPicture = {
//                 //     data : req.file.buffer,
//                 //     contentType : req.file.mimetype
//                 // }
//                 const buffer = req.file?.buffer; // Or use file.buffer from multer
//                 const contentType = req.file?.mimetype; // or get from req.file.mimetype
//                 const extension = contentType?.split("/")[1];
//                 const fileName = `${randomUUID()}.${extension}`;
//                 const bucketName = 'chatbuds';
//                 const uploadParams = {
//                     Bucket: bucketName,
//                     Key: 'roompictures/' + fileName,
//                     Body: buffer,
//                     ContentType: contentType,
//                     ACL: ObjectCannedACL.public_read// Only works if your bucket allows public access
//                 };
//                 await client.send(new PutObjectCommand(uploadParams));
//                 console.log('✅ Uploaded successfully');
//                 // 🔗 Get public URL
//                 roomPicURL = `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/${bucketName}/roompictures/${fileName}`;
//                 console.log('📷 Image URL:', roomPicURL);
//             } else {
//                 roomPicURL = `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/chatbuds/roompictures/roomPP.png`;
//             }
//         }
//         // const room = await RoomModel.create(roomData);
//         roomData.roomPicture = roomPicURL as string;
//         const room = await prisma.room.create({
//             data: {
//                 name: roomData.name,
//                 roomId: roomData.roomId,
//                 roomPicture: roomData.roomPicture,
//             }
//         });
//         console.log("room",room);
//         const userData = await prisma.user.findFirst({
//             select:{
//                 rooms:true,
//                 id: true,
//                 username: true,
//                 profilePicture: true,
//             },
//             where: {
//                 username
//             }
//         });
//         console.log("userData",userData);
//         const rooms = userData?.rooms;
//         console.log(rooms);
//         rooms?.push(room);
//         // const userData = await UserModel.findOne({ username });
//         await prisma.user.update({
//             where:{
//                 username: userData?.username
//             },
//             data:{
//                 rooms: rooms
//             }
//         })
//         res.status(200).json({ message: "Room created", link: roomId });
//     }
//     catch (err) {
//     res.status(500).json({ message: "Server Error", error: err });
// }
// })
userRouter.post("/join-room", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.username;
    const userIdinString = req.userId;
    const roomId = req.body.roomId;
    const userId = new mongoose_1.default.Types.ObjectId(userIdinString);
    try {
        const roomExists = yield db_1.RoomModel.findOne({ roomId });
        if (roomExists) {
            const users = roomExists.users;
            if (users.some((user) => user.toString() === userId.toString())) {
                res.status(406).json({ message: "You are already in the room" });
                return;
            }
            users.push(userId);
            yield db_1.RoomModel.findOneAndUpdate({ roomId }, { users: users });
            const userData = yield db_1.UserModel.findOne({ username });
            const rooms = userData === null || userData === void 0 ? void 0 : userData.rooms;
            rooms === null || rooms === void 0 ? void 0 : rooms.push(roomExists._id);
            yield db_1.UserModel.findOneAndUpdate({ username }, { rooms: rooms });
            res.status(200).json({ message: "User added to room" });
        }
        else {
            res.status(404).json({ message: "Room not found" });
        }
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
}));
userRouter.get("/info/:room_id", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const room_id = req.params.room_id;
    try {
        const room = yield db_1.RoomModel.findById({ _id: room_id }, {}).populate("users", "username profilePicture");
        if (room) {
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
userRouter.get("/home", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.username;
    const userId = req.userId;
    const userData1 = yield db_2.prisma.user.findMany({
        where: {
            id: userId,
            username: username
        }
    });
    console.log(userData1);
    const userData = yield db_1.UserModel.find({ _id: userId, username }, { password: 0, email: 0, __v: 0 }).populate("rooms");
    if (userData[0]) {
        const rooms = userData[0].rooms;
        const messages = yield db_1.MessageModel.find({ room_id: { "$in": rooms } })
            .populate({
            path: "sender",
            select: "username profilePicture"
        })
            .sort({ createdAt: 1 })
            .catch((error) => res.status(400).json({ error }));
        res.status(200).json({ userData: userData[0], messages });
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
}));
userRouter.get("/home/userdata", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.username;
    const userId = req.userId;
    const userData = yield db_2.prisma.user.findMany({
        select: {
            password: false,
            email: false,
            id: true,
            username: true,
            profilePicture: true,
            rooms: {
                select: {
                    id: true,
                    roomId: true,
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
    console.log(userData);
    // const userData = await UserModel.find({_id: userId , username} , {password: 0 , email: 0 , __v: 0}).populate("rooms");
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
    const userData = yield db_1.UserModel.find({ _id: userId, username }, { password: 0, email: 0, __v: 0 }).populate("rooms");
    if (userData[0]) {
        const rooms = userData[0].rooms;
        const messages = yield db_1.MessageModel.find({ room_id: roomId })
            .populate({
            path: "sender",
            select: "username profilePicture"
        })
            .sort({ createdAt: 1 })
            .catch((error) => res.status(400).json({ error }));
        res.status(200).json({ userData: userData[0], messages });
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
}));
exports.default = userRouter;
