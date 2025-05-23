import { ArrowLeftToLine, CirclePlus, Menu, MessageSquarePlus, Search, X } from "lucide-react"
import { Input } from "./Input"
import { RoomCard } from "./RoomCard"
import { userDataProps } from "../types/userData";

interface SidebarProps{
    sidebarOpen: boolean;
    setSidebarOpen: any;
    setCreateRoomModalOpen: any;
    setJoinRoomModalOpen: any;
    setSelectedRoom: (room: any) => void;
    setInfoModalOpen: any;
    userData?: userDataProps;
    refresh:any;
}

export const Sidebar = (props: SidebarProps) => {

    return (
        <div className={`fixed flex flex-col h-screen z-20 transition-all duration-300 ease-in-out ${props.sidebarOpen 
        ? "w-[320px] left-0 shadow-xl md:shadow-none" 
        : "w-[70px] left-0 md:left-0"
    } dark:bg-neutral-800 scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600`}>
        
    <div className="top-0">
    {/* Mobile Menu Button (Always visible when closed) */}
    <div className={`absolute md:hidden ${props.sidebarOpen ? 'hidden' : 'block'} 
        left-5 top-6 text-white hover:-translate-y-1 transition-all
        hover:cursor-pointer z-30`}
        onClick={() => props.setSidebarOpen(true)}>
        <Menu size={22}/>
    </div>

    <div className={`${props.sidebarOpen ? "flex justify-between" : ""}`}>
        <div className={`transition-opacity duration-300 
            ${props.sidebarOpen ? "opacity-100 block" : "hidden opacity-0"} 
            text-white font-medium text-xl my-6 mx-6 whitespace-nowrap`}>
            ChatBuds
        </div>
        
        <div onClick={(e) =>{
            e.preventDefault();
            props.setCreateRoomModalOpen(true);
        }} className={`transition-opacity duration-300 
            ${props.sidebarOpen ? "opacity-100 block" : "hidden opacity-0"} 
            my-6 ml-10 text-white hover:cursor-pointer hover:scale-[1.02] transition-all`}>
            <MessageSquarePlus size={24}/>
        </div>
        <div onClick={(e) =>{
            e.preventDefault();
            props.setJoinRoomModalOpen(true);
        }} className={`transition-opacity duration-300
            ${props.sidebarOpen ? "opacity-100 block" : "opacity-0 hidden"}
            my-6 mr-4 text-white cursor-pointer hover:scale-[1.02] transition-all`}>
        <CirclePlus size={22}/>
        </div>

        <div className={`md:hidden transition-opacity duration-300 
            ${props.sidebarOpen ? "opacity-100" : "opacity-0 ml-5"} 
            text-white mr-4 my-6 hover:-translate-y-1 hover:cursor-pointer`}
            onClick={() => props.setSidebarOpen(false)}>
            <ArrowLeftToLine size={22}/>
        </div>
    </div>

    {/* Search */}
    <div className={`relative rounded-lg outline outline-neutral-700 mx-4 
        transition-opacity duration-300 ${props.sidebarOpen ? "opacity-100 block" : "hidden opacity-0"}`}>
        <div className="absolute left-3 top-2 dark:text-white">
            <Search />
        </div>
        <Input className="w-full pl-11" placeholder="Search Rooms..."/>
        <div className="text-neutral-400 absolute top-3 right-3">
            <X size={18}/>
        </div>
    </div>
    </div>
    {/*Rooms*/}
    <div className="flex-1 overflow-y-auto scrollbar-thin h-screen scrollbar-track-neutral-800 scrollbar-thumb-neutral-600">
    <div className="text-white my-4 mx-1 space-y-4">
        {props.userData?.rooms.length !== 0 ? props.userData?.rooms?.map((room) => (
            <div key={room.id} className="hover:bg-neutral-900 p-2 transition-colors duration-300"
                onClick={(e) =>{
                    e.preventDefault();
                    props.setInfoModalOpen(false);
                    props.setSelectedRoom(room);
                    props.refresh(room.id);
                }}>
                <RoomCard roomPicture={room.roomPicture} name={room.name} sidebarOpen={props.sidebarOpen}/>
            </div>
            )) :
            <div className="text-white"> Create a room to start chatting </div>
        }
    </div>
    </div>
</div>
    )
} 