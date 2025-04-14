import { useEffect, useState } from "react";
import { X } from "../icons/Cross";
import axios from "axios";
import { BACKEND_URL } from "../../Config";
import { Loading } from "./Loading";
import { Input } from "./Input";
import { CopiedClipboard } from "../icons/CopiedClipboard";
import { Clipboard } from "../icons/Clipboard";


interface InfoModalProps{
    infoModalOpen: boolean;
    setInfoModalOpen: any;
    room_id: string | undefined;
}

interface RoomDetails{
        name: string,
        roomPicture?: string
        users: {
            username : string,
            profilePicture: string
        }[],
        createdAt: string,
        updatedAt: string,
        id: string
}

export const InfoModal = (props: InfoModalProps) => {
    const [roomDetails , setRoomDetails] = useState<RoomDetails>({
            name : "",
            roomPicture: "",
            users  : [],
            createdAt: "",
            updatedAt: "",
            id: ""
    });
    const [copy  ,setCopy] = useState<boolean>(false);
    const [loading , setLoading] = useState<boolean>(true);

    useEffect(() => {
        axios.get(`${BACKEND_URL}/info/${props.room_id}` , {
            headers : {
                'Authorization' : localStorage.getItem('token')
            }
        }).then((response) => {
            console.log(response.data);
            if(response.data){
                setRoomDetails(response.data.roomDetails);
                setLoading(false);
            } else{
                setLoading(false);
            }          
        })
        .catch((err) => {
            console.log(err);
        });

    }, []);


    useEffect(() => {
        const timeout = setTimeout(() => {
            setCopy(false);
        }, 1500);

        return () => clearTimeout(timeout);
    }, [copy])

    const handleCopyClick = async () => {
        try {
            await window.navigator.clipboard.writeText(roomDetails.id);
        } catch (err) {
            console.error(
                err
            );
            alert("Copy to clipboard failed.");
        }
    };
    return (
        <>
        {
        props.infoModalOpen &&
        <div className="flex items-center justify-center bg-black/50 backdrop-blur-sm fixed z-50 h-screen w-screen">
            <div className="min-w-64 bg-black outline outline-neutral-900 text-white min-h-32 rounded-md p-4">
                <div className="flex justify-end">
                    <div onClick={(e) => {
                        e.preventDefault();
                        props.setInfoModalOpen(false);
                        }} className="hover:scale-[1.05] cursor-pointer transition-all duration-300 object-contain">
                        <X />
                    </div>
                </div>
                <div>
                    {loading ? <Loading /> : 
                    <div className="flex flex-col justify-center items-center">
                        <div className="font-medium text-xl mb-4">Group info </div>
                        <div>
                            <img className="rounded-full h-32 w-32" src={roomDetails.roomPicture}/>
                        </div>
                        <div className="my-4 text-lg">{roomDetails.name}</div>
                                <div className="text-sm m-3">
                                    Invite Link
                                </div>
                            <div className="flex items-center">
                                <div className="flex items-center">
                                    <Input name={"link"} readOnly value={roomDetails.id} />
                                    <div className="dark:text-white ml-2 cursor-pointer hover:scale-[1.01] transition-all duration-300 object-contain"
                                        onClick={() => {
                                            handleCopyClick();
                                            setCopy(true);
                                        }}>
                                        {copy ? <div className="scale-[1.10] transition-all duration-300 object-contain">
                                            <CopiedClipboard />
                                        </div>
                                            : <Clipboard />}
                                    </div>
                                </div>
                            </div>
                        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-4 h-[1px] w-full" />
                        <div className="mb-4 font-medium">Members</div> 
                            <div className="flex flex-col items-start">
                                {roomDetails?.users.map((user, index) => {
                                    const url = user.profilePicture;
                                    return (
                                            <div key={index} className="flex items-center">
                                                <img className="m-1 rounded-full h-8 w-8" src={url} alt="User Profile" />
                                                <div className="m-1">{user.username}</div>
                                            </div>
                                            );
                                })}
                            </div>
                        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-4 h-[1px] w-full" />
                    </div>}
                </div>
            </div>
        </div>
        }
        </>
    );
}