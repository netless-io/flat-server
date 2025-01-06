import { CreateOrdinary } from "./create/Ordinary";
import { CreatePeriodic } from "./create/Periodic";
import { List } from "./list";
import { UserInfo } from "./info/Users";
import { OrdinaryInfo } from "./info/Ordinary";
import { PeriodicInfo } from "./info/Periodic";
import { UpdateStatusStarted } from "./updateStatus/Started";
import { CancelOrdinary } from "./cancel/Ordinary";
import { UpdateStatusStopped } from "./updateStatus/Stopped";
import { JoinRoom } from "./join";
import { CancelPeriodic } from "./cancel/Periodic";
import { PeriodicSubRoomInfo } from "./info/PeriodicSubRoom";
import { UpdateStatusPaused } from "./updateStatus/Paused";
import { CancelPeriodicSubRoom } from "./cancel/PeriodicSubRoom";
import { RecordAgoraAcquire } from "./record/agora/Acquire";
import { RecordAgoraStarted } from "./record/agora/Started";
import { RecordAgoraQuery } from "./record/agora/Query";
import { RecordAgoraStopped } from "./record/agora/Stopped";
import { RecordAgoraUpdateLayout } from "./record/agora/UpdateLayout";
import { RecordInfo } from "./record/Info";
import { UpdateOrdinary } from "./update/Ordinary";
import { CancelHistory } from "./cancel/History";
import { UpdatePeriodicSubRoom } from "./update/PeriodicSubRoom";
import { UpdatePeriodic } from "./update/Periodic";
import { RecordStarted } from "./record/Started";
import { RecordStopped } from "./record/Stopped";
import { ControllerClass } from "../../../abstract/controller";
import { SetGrade } from "./grade/Set";
import { GetGrade } from "./grade/Get";

export const roomRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    CreateOrdinary,
    CreatePeriodic,
    List,
    JoinRoom,
    OrdinaryInfo,
    PeriodicInfo,
    PeriodicSubRoomInfo,
    UserInfo,
    UpdateStatusStarted,
    UpdateStatusPaused,
    UpdateStatusStopped,
    UpdateOrdinary,
    UpdatePeriodic,
    UpdatePeriodicSubRoom,
    CancelOrdinary,
    CancelPeriodic,
    CancelPeriodicSubRoom,
    CancelHistory,
    RecordStarted,
    RecordStopped,
    RecordAgoraAcquire,
    RecordAgoraStarted,
    RecordAgoraQuery,
    RecordAgoraUpdateLayout,
    RecordAgoraStopped,
    RecordInfo,
    SetGrade,
    GetGrade
]);
