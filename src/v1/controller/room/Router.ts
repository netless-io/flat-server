import { FastifyRoutes } from "../../../types/Server";
import { createOrdinary, createOrdinarySchemaType } from "./create/Ordinary";
import { createPeriodic, createPeriodicSchemaType } from "./create/Periodic";
import { list, listSchemaType } from "./list";
import { userInfo, userInfoSchemaType } from "./info/Users";
import { ordinaryInfo, OrdinaryInfoSchemaType } from "./info/Ordinary";
import { periodicInfo, periodicInfoSchemaType } from "./info/Periodic";
import { started, startedSchemaType } from "./updateStatus/Started";
import { cancelOrdinary, cancelOrdinarySchemaType } from "./cancel/Ordinary";
import { stopped, stoppedSchemaType } from "./updateStatus/Stopped";
import { join, joinSchemaType } from "./join";
import { cancelPeriodic, cancelPeriodicSchemaType } from "./cancel/Periodic";
import { periodicSubRoomInfo, periodicSubRoomInfoSchemaType } from "./info/PeriodicSubRoom";
import { paused, pausedSchemaType } from "./updateStatus/Paused";
import { cancelPeriodicSubRoom, cancelPeriodicSubRoomSchemaType } from "./cancel/PeriodicSubRoom";
import { recordAgoraAcquire, recordAgoraAcquireSchemaType } from "./record/agora/Acquire";
import { recordAgoraStarted, recordAgoraStartedSchemaType } from "./record/agora/Started";
import { recordAgoraQuery, recordAgoraQuerySchemaType } from "./record/agora/Query";
import { recordAgoraStopped, recordAgoraStoppedSchemaType } from "./record/agora/Stopped";
import {
    recordAgoraUpdateLayout,
    recordAgoraUpdateLayoutSchemaType,
} from "./record/agora/UpdateLayout";
import { recordInfo, recordInfoSchemaType } from "./record/Info";
import { updateOrdinary, updateOrdinarySchemaType } from "./update/Ordinary";
import { cancelHistory, cancelHistorySchemaType } from "./cancel/History";
import { updatePeriodicSubRoom, updatePeriodicSubRoomSchemaType } from "./update/PeriodicSubRoom";
import { updatePeriodic, updatePeriodicSchemaType } from "./update/Periodic";
import { recordStarted, recordStartedSchemaType } from "./record/Started";
import { recordStopped, recordStoppedSchemaType } from "./record/Stopped";

export const roomRouters: Readonly<FastifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "post",
        path: "room/create/ordinary",
        handler: createOrdinary,
        auth: true,
        schema: createOrdinarySchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/create/periodic",
        handler: createPeriodic,
        auth: true,
        schema: createPeriodicSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/list/:type",
        handler: list,
        auth: true,
        schema: listSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/join",
        handler: join,
        auth: true,
        schema: joinSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/info/ordinary",
        handler: ordinaryInfo,
        auth: true,
        schema: OrdinaryInfoSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/info/periodic",
        handler: periodicInfo,
        auth: true,
        schema: periodicInfoSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/info/periodic-sub-room",
        handler: periodicSubRoomInfo,
        auth: true,
        schema: periodicSubRoomInfoSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/info/users",
        handler: userInfo,
        auth: true,
        schema: userInfoSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update-status/started",
        handler: started,
        auth: true,
        schema: startedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update-status/paused",
        handler: paused,
        auth: true,
        schema: pausedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update-status/stopped",
        handler: stopped,
        auth: true,
        schema: stoppedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update/ordinary",
        handler: updateOrdinary,
        auth: true,
        schema: updateOrdinarySchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update/periodic",
        handler: updatePeriodic,
        auth: true,
        schema: updatePeriodicSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update/periodic-sub-room",
        handler: updatePeriodicSubRoom,
        auth: true,
        schema: updatePeriodicSubRoomSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/cancel/ordinary",
        handler: cancelOrdinary,
        auth: true,
        schema: cancelOrdinarySchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/cancel/periodic",
        handler: cancelPeriodic,
        auth: true,
        schema: cancelPeriodicSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/cancel/periodic-sub-room",
        handler: cancelPeriodicSubRoom,
        auth: true,
        schema: cancelPeriodicSubRoomSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/cancel/history",
        handler: cancelHistory,
        auth: true,
        schema: cancelHistorySchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/started",
        handler: recordStarted,
        auth: true,
        schema: recordStartedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/stopped",
        handler: recordStopped,
        auth: true,
        schema: recordStoppedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/update-end-time",
        // the logic here is consistent with room/record/stopped
        handler: recordStopped,
        auth: true,
        schema: recordStoppedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/agora/acquire",
        handler: recordAgoraAcquire,
        auth: true,
        schema: recordAgoraAcquireSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/agora/started",
        handler: recordAgoraStarted,
        auth: true,
        schema: recordAgoraStartedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/agora/query",
        handler: recordAgoraQuery,
        auth: true,
        schema: recordAgoraQuerySchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/agora/update-layout",
        handler: recordAgoraUpdateLayout,
        auth: true,
        schema: recordAgoraUpdateLayoutSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/agora/stopped",
        handler: recordAgoraStopped,
        auth: true,
        schema: recordAgoraStoppedSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/record/info",
        handler: recordInfo,
        auth: true,
        schema: recordInfoSchemaType,
    }),
]);
