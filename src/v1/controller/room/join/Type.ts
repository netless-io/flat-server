import { Status } from "../../../../Constants";

export type Result =
    | {
          status: Status.Success;
          data: {
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
