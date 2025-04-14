export interface userDataProps { 
        id: string;
        username : string;
        createdAt ?: string,
        updatedAt ?: string;
        profilePicture?: {
            data: any,
            contentType: any,
        }
        rooms : {
            name : string,
            roomId : string,
            roomPicture ?: string,
            users: string[],
            updatedAt ?: string,
            createdAt ?: string,
            id ?: any
        }[] 
    } 
