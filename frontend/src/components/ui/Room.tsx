import { SendHorizontal } from "lucide-react";
import { Input } from "./Input";
import { RoomNavbar } from "./RoomNavbar";
import { userDataProps } from "../types/userData";
import { useEffect, useRef, useState } from "react";
import { InfoModal } from "./InfoModal";
import MessageBubble from "./MessageBubble";
interface Message {
    id: string;
    text: string;
    timestamp: string;
    roomId: string;
    sender: {
        profilePicture:string
        username?: string,
        id: string
    };
}
interface RoomProps {
    room?: {
        id: string;
        roomId: string;
        name: string;
        roomPicture?: string;
    };
    messages?: Message[]
    userData?: userDataProps;
    socket: WebSocket;
    infoModalOpen: boolean;
    setInfoModalOpen: any;
}

export const Room = (props: RoomProps) => {
    const [roomMessages, setRoomMessages] = useState<Message[]>([]);
    const [formData, setFormData] = useState({
        text: ""
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebSocket handler with cleanup
    useEffect(() => {
        const filtered_messages = props.messages?.filter((message) => {
            return message.roomId === props.room?.id
        }
    );
    if (filtered_messages !== undefined) {
        setRoomMessages(filtered_messages);
    }
    }, [props.room?.id, props.messages]);

    useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === "chat" && data.roomId === props.room?.id) {
                setRoomMessages(prev => [...prev, data]);
            }
        };

        props.socket.addEventListener('message', messageHandler);
        return () => props.socket.removeEventListener('message', messageHandler);
    }, [props.room?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [roomMessages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.text.trim()) return;


        props.socket.send(JSON.stringify({
            type: "chat",
            payload: {
                roomId: props.room?.id,
                userId: props.userData?.id,
                profilePicture : props.userData?.profilePicture,
                msg: formData.text,
                username: props.userData?.username
            }
        }));

        setFormData({ text: "" });
    };


    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    }

    

    return (
        <>
            <InfoModal room_id={props.room?.id} infoModalOpen={props.infoModalOpen} setInfoModalOpen={props.setInfoModalOpen} />
            <div className="flex flex-col bg-neutral-900 h-screen">
                <div className="fixed top-0 w-screen z-10">
                    <RoomNavbar setInfoModalOpen={props.setInfoModalOpen} room={props.room} />
                </div>

                <div className="flex-1 overflow-y-auto pt-16 pb-24 px-4 
                scrollbar-thin
                scrollbar-track-neutral-800 
                scrollbar-thumb-neutral-600">

                    <div className="flex flex-col space-y-4 mt-6">
                        <div className="flex flex-col space-y-4">
                            {roomMessages
                                .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                .map((message, index) => {
                                    const url: string = message.sender.profilePicture;
                                    return(
                                    <div key={`temp-${index}`} className={`flex ${message.sender?.id === props.userData?.id ?
                                            'items-end flex-col' : 'items-start'
                                        }`}>
                                        <div className="flex items-center">
                                            {
                                                message.sender?.id !== props.userData?.id && 
                                                <img className="md:h-10 md:w-10 md:mr-2 mr-1 h-6 w-6 rounded-full" src={url} alt="User Profile"/>
                                            }
                                            <MessageBubble message={message} userData={props.userData} />
                                           {
                                                message.sender?.id === props.userData?.id && 
                                                <img className="h-10 w-10 ml-1 rounded-full" src={url} alt="User Profile"/>
                                            }
                                        </div>
                                    </div>
                                    )
                                })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>
                <form autoComplete={"off"} onSubmit={handleSubmit}>
                    <div className="fixed flex items-center bottom-0 w-full bg-black pt-4 pb-6 px-4 border-t border-neutral-800">


                        <div className="md:w-1/2 w-2/3 lg:w-2/3 xl:w-3/4 3xl:w-4/5">
                            <Input name={"text"} value={formData.text} onChange={handleChange} placeholder="Type a message" />
                        </div>

                        <button type="submit">
                            <div className="ml-4 mr-6 text-white">
                                <SendHorizontal size={24} />
                            </div>
                        </button>

                    </div>
                </form>
            </div>
        </>
    );
};

