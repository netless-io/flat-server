export enum ErrorCode {
    ParamsCheckFailed = 100000, // parameter verification failed
    ServerFail, // server fail (retry)
    CurrentProcessFailed, // current processing failed
    CanRetry, // you can try again
    NotPermission, // insufficient permissions
    NeedLoginAgain, // user need login in again
    UnsupportedPlatform, // Unsupported login platform
    JWTSignFailed, // jwt sign failed

    RedisSetDataFailed = 200000, // redis set data failed

    RoomNotFound = 300000, // room not found
    RoomIsEnded, // room has been ended
    RoomIsRunning, // room status is running
    UserNotInRoom, // user is not in this room
    RoomNotIsRunning, // room not is running
    RoomNotIsEnded, // room not is stopped
    RoomNotIsIdle, // room not is idle

    PeriodicNotFound = 400000, // room not found
    PeriodicIsEnded, // room has been ended
    PeriodicSubRoomHasRunning, // periodic sub room has running

    UserNotFound = 500000, // user not found

    RecordNotFound = 500000, // record info not found
}
