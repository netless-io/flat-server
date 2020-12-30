import { FastifyRoutes } from "../../types/Server";
import { create, createSchemaType } from "./create";
import { schedule, scheduleSchemaType } from "./schedule";
import { list, listSchemaType } from "./list";
import { joinPeriodic, joinPeriodicSchemaType } from "./join/Periodic";
import { joinOrdinary, joinOrdinarySchemaType } from "./join/Ordinary";
import { userInfo, userInfoSchemaType } from "./users/Info";
import { roomInfo, roomInfoSchemaType } from "./info/Room";
import { periodicInfo, periodicInfoSchemaType } from "./info/Periodic";
import { running, runningSchemaType } from "./update/Running";
import { cancelOrdinary, cancelOrdinarySchemaType } from "./update/CancelOrdinary";

export const httpRoom: Readonly<FastifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "post",
        path: "room/create",
        handler: create,
        auth: true,
        schema: createSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/schedule",
        handler: schedule,
        auth: true,
        schema: scheduleSchemaType,
    }),
    Object.freeze({
        method: "get",
        path: "room/list/:type",
        handler: list,
        auth: true,
        schema: listSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/join/ordinary",
        handler: joinOrdinary,
        auth: true,
        schema: joinOrdinarySchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/join/periodic",
        handler: joinPeriodic,
        auth: true,
        schema: joinPeriodicSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/users/info",
        handler: userInfo,
        auth: true,
        schema: userInfoSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/info",
        handler: roomInfo,
        auth: true,
        schema: roomInfoSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/periodic/info",
        handler: periodicInfo,
        auth: true,
        schema: periodicInfoSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update/running",
        handler: running,
        auth: true,
        schema: runningSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "room/update/cancelOrdinary",
        handler: cancelOrdinary,
        auth: true,
        schema: cancelOrdinarySchemaType,
    }),
]);
