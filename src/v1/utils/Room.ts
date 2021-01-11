import { RoomStatus } from "../controller/room/Constants";

export const roomIsRunning = (roomStatus: RoomStatus): boolean => {
    return [RoomStatus.Paused, RoomStatus.Started].includes(roomStatus);
};
