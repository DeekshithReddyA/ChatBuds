
import { Info } from 'lucide-react';

interface RoomNavbarProps{
    room?: {
        name: string;
        roomId: string;
        roomPicture?: string;
    }
    setInfoModalOpen: any;

}

export const RoomNavbar = (props: RoomNavbarProps) => {



    return (
        <div className="bg-neutral-700 min-h-16 max-h-20 p-3">
            <div className='flex justify-between'>
            <div className="flex ml-2">
                    <img className={`rounded-full h-14 w-14`} src={props.room?.roomPicture} />
                <div className={`mt-2 ml-6 font-medium text-lg text-white`}>
                    {props.room?.name}
                </div>
            </div>
            <div className='text-white text-xl'>
                <div onClick={(e) => {
                    e.preventDefault();
                    props.setInfoModalOpen(true);
                }} 
                    className='mr-20 mt-3 md:mr-[330px] text-white hover:scale-[1.03] cursor-pointer'>
                    <Info/>
                </div>
            </div>
            </div>
        </div>
    );
}