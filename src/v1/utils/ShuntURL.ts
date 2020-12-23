export const shuntCreateRoomURL = "https://api.netless.link/v5/rooms";

export const shuntRequestRoomTokenURL = (uuid: string): string => {
    return `https://api.netless.link/v5/tokens/rooms/${uuid}`;
};
