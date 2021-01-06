import { Status } from "../../../../Constants";
import { RoomType } from "../Constants";
import { ErrorCode } from "../../../../ErrorCode";

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
          code: ErrorCode;
      };
