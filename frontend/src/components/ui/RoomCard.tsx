interface RoomCardProps {
    sidebarOpen?: boolean;
    name: string;
    roomPicture?: string;
    }
        

export const RoomCard = (props: RoomCardProps) => {

    return (
        <div>
            <div className="flex">
                <img className={`ml-1 rounded-full ${props.sidebarOpen ? "h-14 w-14" : "h-9 w-9"}`} src={props.roomPicture} alt='roomPicture'/>
                <div className={`mt-3 ml-6 ${props.sidebarOpen ? "block text-white font-medium text-xl" : "hidden"}`}>
                    {props.name}
                </div>
            </div>
        </div>
    );
}