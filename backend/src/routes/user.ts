import { Request, Router } from "express";
import bcrypt from 'bcrypt';
import { MessageModel, RoomModel, UserModel } from "../db";
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { userMiddleware } from "../middleware";
import mongoose from "mongoose";
import crypto from 'crypto';
import multer from 'multer';
import { prisma } from "../db";
import { randomUUID } from "crypto";
import { ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';


const client = new S3Client({
    forcePathStyle: true,
    region: 'ap-south-1',
    endpoint: 'https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/s3',
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID as string,
        secretAccessKey: process.env.SECRET_ACCESS_KEY as string
    }
});

async function handleRoomPictureUpload(req: Request) {
  const bucketName = 'chatbuds';
  
  // Use default picture if no custom picture is provided
  if (req.body.roomPicture === "groupPP") {
    return `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/${bucketName}/roompictures/roomPP.png`;
  }

  // Handle custom picture upload
  const buffer = req.file?.buffer;
  const contentType = req.file?.mimetype;
  const extension = contentType?.split("/")[1];
  const fileName = `${randomUUID()}.${extension}`;

  const uploadParams = {
    Bucket: bucketName,
    Key: `roompictures/${fileName}`,
    Body: buffer,
    ContentType: contentType,
    ACL: ObjectCannedACL.public_read
  };

  await client.send(new PutObjectCommand(uploadParams));
  
  return `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/${bucketName}/roompictures/${fileName}`;
}

type ObjectId = mongoose.Types.ObjectId;
interface userDataType {
    username: String;
    email: String;
    password: String;
    profilePicture?: ""

}
interface RoomDataType {
    roomId: string;
    name: string;
    // users : mongoose.Types.ObjectId[];
    users: string[]
    roomPicture?: string
}

const userRouter = Router();

const saltRounds: number = 5;
const JWT_SECRET: any = process.env.JWT_SECRET;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

userRouter.post("/signup", upload.single('profilePicture'), async (req, res) => {
    const { email, password, username } = req.body;
    console.log("req", req.body);

    if (email === "" || password === "" || username === "" || email === undefined || password === undefined || username === undefined) {
        res.status(406).json({ message: "Enter all details" });
        return;
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                email: email,
                username: username
            }
        });
        console.log(existingUser);
        // const existingUser = await UserModel.findOne({email : email , username : username});
        if (existingUser) {
            res.status(406).json({ message: "User with this email and username already exists." });
        } else {
            const hashPassword = await bcrypt.hash(password, saltRounds);

            const userData: userDataType = { username, email, password: hashPassword };
            console.log(req.file);
            let profilePicURL;
            if (req.body.profilePicture !== "userPP") {
                const buffer = req.file?.buffer; // Or use file.buffer from multer
                const contentType = req.file?.mimetype; // or get from req.file.mimetype
                const extension = contentType?.split("/")[1];
                const fileName = `${randomUUID()}.${extension}`;
                const bucketName = 'chatbuds';

                const uploadParams = {
                    Bucket: bucketName,
                    Key: 'profilepictures/' + fileName,
                    Body: buffer,
                    ContentType: contentType,
                    ACL: ObjectCannedACL.public_read// Only works if your bucket allows public access
                };

                await client.send(new PutObjectCommand(uploadParams));
                console.log('✅ Uploaded successfully');

                // 🔗 Get public URL
                profilePicURL = `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/${bucketName}/profilepictures/${fileName}`;
                console.log('📷 Image URL:', profilePicURL);

            } else {
                profilePicURL = `https://gerjkvkukfpmayzvpkqu.supabase.co/storage/v1/object/public/chatbuds/profilepictures/userPP.png`;
            }
            const response = await prisma.user.create({
                data: {
                    username: username,
                    email,
                    password: hashPassword,
                    profilePicture: profilePicURL
                }
            });
            const token = jwt.sign({
                id: response.id,
                username: response.username,
            }, JWT_SECRET)
            res.status(200).json({ message: "User signed up", token });
        }
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err });
    }

});

userRouter.post("/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (password === "" || username === "" || password === undefined || username === undefined) {
        res.status(406).json({ message: "Enter all details" });
        return;
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                username: username
            }
        });
        // const existingUser: any = await UserModel.findOne({username});
        console.log(existingUser);
        if (existingUser) {
            const hashedPass: string = existingUser.password;

            const passwordsMatch: boolean = await bcrypt.compare(password, hashedPass);
            if (passwordsMatch) {
                const token = jwt.sign({
                    id: existingUser.id,
                    username: username
                }, JWT_SECRET);
                res.status(200).json({ token });
            } else {
                res.status(400).json({ message: "Wrong credentials" });
            }
        } else {
            res.status(404).json({ message: "User with this username doesn't exist" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err });
    }
});

userRouter.post("/create-room" , userMiddleware , upload.single("roomPicture") , async(req, res) => {
    try {
        const { username, userId } = req;
        const { roomName } = req.body;
        const roomId = crypto.randomUUID();
        
        // Check if room already exists (though UUID collision is extremely unlikely)
        const roomExists = await prisma.room.findFirst({
            where: { roomId }
        });
        
        if (roomExists) {
            res.status(400).json({ message: "There was a problem! Please try again" });
            return;
        }
        
        // Generate room picture URL
        const roomPicURL = await handleRoomPictureUpload(req);
        
        // Create the room
        const room = await prisma.room.create({
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
} catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Server Error", error: err });
    return;
}

})

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

userRouter.post("/join-room", userMiddleware, async (req, res) => {
    const username: string = req.username;
    const userIdinString: string = req.userId;
    const roomId: string = req.body.roomId;

    const userId: ObjectId = new mongoose.Types.ObjectId(userIdinString);

    try {
        const roomExists = await RoomModel.findOne({ roomId })
        if (roomExists) {
            const users = roomExists.users;
            if (users.some((user) => user.toString() === userId.toString())) {
                res.status(406).json({ message: "You are already in the room" });
                return;
            }
            users.push(userId);
            await RoomModel.findOneAndUpdate({ roomId }, { users: users });

            const userData = await UserModel.findOne({ username });
            const rooms = userData?.rooms;
            rooms?.push(roomExists._id);
            await UserModel.findOneAndUpdate({ username }, { rooms: rooms });

            res.status(200).json({ message: "User added to room" })
        } else {
            res.status(404).json({ message: "Room not found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
});

userRouter.get("/info/:room_id", userMiddleware, async (req, res) => {
    const room_id: string = req.params.room_id;

    try {
        const room = await RoomModel.findById({ _id: room_id }, {}).populate("users", "username profilePicture");
        if (room) {
            res.status(200).json({ roomDetails: room });
        } else {
            res.status(204).json({ message: "Room not found!" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
})


userRouter.get("/home", userMiddleware, async (req, res) => {
    const username: string = req.username;
    const userId: string = req.userId;

    const userData1 = await prisma.user.findMany({
        where: {
            id: userId,
            username: username
        }
    })
    console.log(userData1);
    const userData = await UserModel.find({ _id: userId, username }, { password: 0, email: 0, __v: 0 }).populate("rooms");
    if (userData[0]) {
        const rooms = userData[0].rooms;
        const messages = await MessageModel.find({ room_id: { "$in": rooms } })
            .populate({
                path: "sender",
                select: "username profilePicture"
            })
            .sort({ createdAt: 1 })
            .catch((error) => res.status(400).json({ error }));
        res.status(200).json({ userData: userData[0], messages });
    } else {
        res.status(404).json({ message: "User not found" });
    }
})

userRouter.get("/home/userdata", userMiddleware, async (req, res) => {
    const username: string = req.username;
    const userId: string = req.userId;

    const userData = await prisma.user.findMany({
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
        res.status(200).json({ userData: userData[0] })
    } else {
        res.status(404).json({ message: "User not found" });
    }
})

userRouter.get("/home/:roomId", userMiddleware, async (req, res) => {
    const username: string = req.username;
    const userId: string = req.userId;
    const roomId: string = req.params.roomId;

    const userData = await UserModel.find({ _id: userId, username }, { password: 0, email: 0, __v: 0 }).populate("rooms");
    if (userData[0]) {
        const rooms = userData[0].rooms;
        const messages = await MessageModel.find({ room_id: roomId })
            .populate({
                path: "sender",
                select: "username profilePicture"
            })
            .sort({ createdAt: 1 })
            .catch((error) => res.status(400).json({ error }));
        res.status(200).json({ userData: userData[0], messages });
    } else {
        res.status(404).json({ message: "User not found" });
    }
})

export default userRouter;
