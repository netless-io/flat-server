export enum ErrorCode {
    ParamsCheckFailed = 100000, // parameter verification failed
    ServerFail, // server fail (retry)
    CurrentProcessFailed, // current processing failed
    NotPermission, // insufficient permissions
    NeedLoginAgain, // user need login in again
    UnsupportedPlatform, // Unsupported login platform
    JWTSignFailed, // jwt sign failed

    RoomNotFound = 200000, // room not found
    RoomIsEnded, // room has been ended
    RoomIsRunning, // room status is running
    RoomNotIsRunning, // room not is running
    RoomNotIsEnded, // room not is stopped
    RoomNotIsIdle, // room not is idle

    PeriodicNotFound = 300000, // room not found
    PeriodicIsEnded, // room has been ended
    PeriodicSubRoomHasRunning, // periodic sub room has running

    UserNotFound = 400000, // user not found

    RecordNotFound = 500000, // record info not found

    FileNotFound = 600000, // file info not found
    FileSizeTooBig, // single file size too big
    FileExists, // file already exists

    NotEnoughTotalUsage = 700000, // not enough TotalUsage
}
