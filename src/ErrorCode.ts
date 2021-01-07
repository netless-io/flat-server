export enum ErrorCode {
    ParamsCheckFailed = 100000, // parameter verification failed
    ServerFail, // server fail (retry)
    CurrentProcessFailed, // current processing failed
    CanRetry, // you can try again
    NotPermission, // insufficient permissions

    NeedLoginAgain, // user need login in again
    UnsupportedPlatform, // Unsupported login platform

    SituationHasChanged, // the situation has changed and new data needs to be retrieved (in classroom: exit, not in classroom: refresh)

    RedisSetDataFailed, // redis set data failed

    JWTSignFailed, // jwt sign failed

    RoomNotFound, // room not found,
    RoomIsEnded, // room has been ended
    UserNotInRoom, // user is not in this room
    RoomIsRunning, // room status is running
    PeriodicNotFound, // room not found
    PeriodicIsEnded, // room has been ended

    UserNotFound, // user not found
}
