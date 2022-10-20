export type RoomExportUserItem = {
    userName: string;
    userPhone?: string;
    joinRoomDate: number;
};

export type RoomExportUsersReturn = {
    roomStartDate: number;
    roomEndDate: number;
    ownerName: string;
    roomTitle: string;
    users: RoomExportUserItem[];
};

export type RoomInfoWithOwnerName = {
    roomUUID: string;
    roomTitle: string;
    roomStartDate: number;
    roomEndDate: number;
    ownerName: string;
};
