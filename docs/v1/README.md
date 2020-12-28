```
POST agora/token/generate/rtc (generateRTC) [auth]
body:
  interface GenerateRTCBody {
      channelName: string;
      uid: number;
      roomUUID: string;
  }
results:
  {
      status: Status.Success,
      data: {
          token,
      },
  }

POST agora/token/generate/rtm (generateRTM) [auth]
results:
  {
      status: Status.Success,
      data: {
          token,
      },
  }

GET login/weChat/callback/:socketID (callback)
params:
  interface CallbackParams {
      socketID: string;
  }
query:
  interface CallbackQuery {
      state: string;
      code: string;
  }
results:

POST login (login) [auth]
results:
  {
      status: Status.Failed,
      message: "User does not exist",
  }
  {
      status: Status.AuthFailed,
      message: "The account token has expired, please log in again",
  }
  {
      status: Status.AuthFailed,
      message: (e as Error).message,
  }
  {
      status: Status.Success,
      data: {
          name: userInfoInstance.user_name,
          sex: userInfoInstance.sex,
          avatar: userInfoInstance.avatar_url,
          userUUID,
      },
  }

POST room/create (create) [auth]
body:
  interface CreateBody {
      title: string;
      type: RoomType;
      beginTime: number;
      docs?: Docs[];
  }
results:
  {
      status: Status.Failed,
      message: "Creation room time cannot be less than current time",
  }
  {
      status: Status.Success,
      data: {
          roomUUID,
      },
  }
  {
      status: Status.Failed,
      message: "Failed to create room",
  }

POST room/schedule (schedule) [auth]
body:
  interface ScheduleBody {
      title: string;
      type: RoomType;
      beginTime: number;
      endTime: number;
      periodic: Periodic;
      docs?: Docs[];
  }
results:
  {
      status: Status.Failed,
      message: "Creation room time cannot be less than current time",
  }
  {
      status: Status.Failed,
      message: "The end time cannot be less than the creation time",
  }
  {
      status: Status.Failed,
      message:
          "The interval between the start time and the end time must be greater than 15 minutes",
  }
  {
      status: Status.Success,
  }
  {
      status: Status.Failed,
      message: "Failed to schedule room",
  }

GET room/list/:type (list) [auth]
params:
  interface ListParams {
      type: ListType;
  }
query:
  interface ListQuery {
      page: number;
  }
results:
  {
      status: Status.Success,
      data: resp,
  }
  {
      status: Status.Failed,
      message: "Error in querying room list",
  }

POST room/join/ordinary (joinOrdinary) [auth]
body:
  interface JoinOrdinaryBody {
      roomUUID: string;
  }
results:
  {
      status: Status.Failed,
      message: "Room not found",
  }
  {
      status: Status.Failed,
      message: "Room has been ended",
  }
  {
      status: Status.Success,
      data: {
          whiteboardRoomToken: createWhiteboardRoomToken(roomInfo.whiteboard_room_uuid),
          whiteboardRoomUUID: roomInfo.whiteboard_room_uuid,
      },
  }
  {
      status: Status.Failed,
      message: "Join room failed",
  }

POST room/join/periodic (joinPeriodic) [auth]
body:
  interface JoinPeriodicBody {
      periodicUUID: string;
  }
results:
  {
      status: Status.Failed,
      message: "Periodic room not found",
  }
  {
      status: Status.Failed,
      message: "Periodic has been ended",
  }
  {
      status: Status.Failed,
      message: "Room has ended or been deleted",
  }
  {
      status: Status.Success,
      data: {
          roomUUID: roomInfo.room_uuid,
          whiteboardRoomToken: createWhiteboardRoomToken(roomInfo.whiteboard_room_uuid),
          whiteboardRoomUUID: roomInfo.whiteboard_room_uuid,
      },
  }
  {
      status: Status.Failed,
      message: "Join room failed",
  }

POST room/users/info (userInfo) [auth]
body:
  interface UserInfoBody {
      roomUUID: string;
  }
results:
  {
      status: Status.Failed,
      message: "Not have permission",
  }
  {
      status: Status.Failed,
      message: "Room not found",
  }
  {
      status: Status.Success,
      data: {
          owner,
          myself,
          learners,
      },
  }
  {
      status: Status.Failed,
      message: "Get room users info failed",
  }

POST room/info (roomInfo) [auth]
body:
  interface RoomInfoBody {
      roomUUID: string;
      queryDocs: boolean;
  }
results:
  {
      status: Status.Failed,
      message: "Not have permission",
  }
  {
      status: Status.Failed,
      message: "Room not found",
  }
  {
      status: Status.Success,
      data: {
          roomInfo: {
              title: roomInfo.title,
              beginTime: roomInfo.begin_time,
              endTime: roomInfo.end_time,
              roomType: roomInfo.room_type,
              roomStatus: roomInfo.room_status,
              creatorUserUUID: roomInfo.creator_user_uuid,
          },
          docs,
      },
  }
  {
      status: Status.Failed,
      message: "get room info failed",
  }

```
