import { RoomStatus } from "../Constants";

export const roomIsRunning = (roomStatus: RoomStatus): boolean => {
    return [RoomStatus.Paused, RoomStatus.Started].includes(roomStatus);
};
