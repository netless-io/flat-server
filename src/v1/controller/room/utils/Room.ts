import { RoomStatus } from "../../../../model/room/Constants";

export const roomIsRunning = (roomStatus: RoomStatus): boolean => {
    return [RoomStatus.Paused, RoomStatus.Started].includes(roomStatus);
};

export const roomIsIdle = (roomStatus: RoomStatus): boolean => {
    return roomStatus === RoomStatus.Idle;
};
