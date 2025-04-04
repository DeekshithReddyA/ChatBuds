import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../Config";

export const useUserData = (roomId: string) => {
    const navigation = useNavigate();
    const [userData , setUserData ] = useState();
    const [messageData, setMessageData] = useState([]);

    const refresh = (roomId: string) => {
        if(roomId == ""){
            axios.get(`${BACKEND_URL}/home/userdata` ,{
                headers: {
                    "Authorization" : localStorage.getItem('token')
                }
            })
            .then((response) => {
                setUserData(response.data.userData);
            })
            .catch(() => navigation('/'));
        }

        if(roomId != ""){
            axios.get(`${BACKEND_URL}/home/${roomId}` ,{
                headers: {
                    "Authorization" : localStorage.getItem('token')
                }
            })
            .then((response) => {
                setMessageData(response.data.messages);
            })
            .catch(() => navigation('/'));
        }
    }

    useEffect(() => {
        refresh(roomId);
    }, []);

    return {refresh ,  userData , messages : messageData};
}