import { Request, Router } from "express";
import bcrypt from 'bcrypt';
import { MessageModel, RoomModel, UserModel } from "../db";
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { userMiddleware } from "../middleware";
import mongoose from "mongoose";
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

        if (existingUser) {
            res.status(406).json({ message: "User with this email and username already exists." });
        } else {
            const hashPassword = await bcrypt.hash(password, saltRounds);

            const userData: userDataType = { username, email, password: hashPassword };
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
        
        // Generate room picture URL
        const roomPicURL = await handleRoomPictureUpload(req);
        
        // Create the room
        const room = await prisma.room.create({
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
} catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Server Error", error: err });
    return;
}

})


userRouter.post("/join-room", userMiddleware, async (req, res) => {
    const username: string = req.username;
    const userIdinString: string = req.userId;
    const roomId: string = req.body.roomId;

    try {
        // Check if the room exists
        const room = await prisma.room.findUnique({
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
        await prisma.room.update({
            where: { id: roomId },
            data: {
                users: {
                    connect: { id: userIdinString },
                },
            },
        });

        // Also update user's rooms (optional, since it's the same relation)
        await prisma.user.update({
            where: { id: userIdinString },
            data: {
                rooms: {
                    connect: { id: roomId },
                },
            },
        });

        res.status(200).json({ message: "User added to room successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err });
    }
});


userRouter.get("/info/:room_id", userMiddleware, async (req, res) => {
    const room_id: string = req.params.room_id;

    try {
        const room = await prisma.room.findFirst({
            where: {
                id : room_id
            },
            select :{
                id: true,
                name: true,
                roomPicture: true,
                createdAt: true,
                updatedAt: true,
                users : true
            }
        })
       
        if (room !== null) {
            res.status(200).json({ roomDetails: room });
        } else {
            res.status(204).json({ message: "Room not found!" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
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
        res.status(200).json({ userData: userData[0] })
    } else {
        res.status(404).json({ message: "User not found" });
    }
})

userRouter.get("/home/:roomId", userMiddleware, async (req, res) => {
    const username: string = req.username;
    const userId: string = req.userId;
    const roomId: string = req.params.roomId;

    const userData = await prisma.user.findFirst({
        where:{
            id: userId, 
            username: username
        },
        select:{
            username: true,
            rooms: true,
            password: false,
            email: false,
            messages: true
        }        
    })


    if (userData !== null) {
        const rooms = userData.rooms;

        const messages = await prisma.messages.findMany({
            where: {
                roomId: roomId,
            },
            orderBy:{
                timestamp: 'asc'
            },
            select:{
                id:true,
                roomId: true,
                text:true,
                timestamp: true,
                sender: {
                    select : {
                        id: true, 
                        username: true,
                        profilePicture: true
                    }
                }
            }
        });

        res.status(200).json({ userData: userData, messages });
    } else {
        res.status(404).json({ message: "User not found" });
    }
})

export default userRouter;
