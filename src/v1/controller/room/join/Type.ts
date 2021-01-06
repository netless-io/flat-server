import { Status } from "../../../../Constants";
import { RoomType } from "../Constants";

export type Result =
    | {
          status: Status.Success;
          data: {
              roomType: RoomType;
              roomUUID: string;
              whiteboardRoomToken: string;
              whiteboardRoomUUID: string;
              rtcUID: number;
              rtcToken: string;
              rtmToken: string;
          };
      }
    | {
          status: Status.Failed;
          message: string;
      };
