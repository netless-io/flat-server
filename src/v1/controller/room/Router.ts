import { FastifyRoutes } from "../../types/Server";
import { create, createSchemaType } from "./create";
import { schedule, scheduleSchemaType } from "./schedule";
import { list, listSchemaType } from "./list";
import { joinCyclical, joinCyclicalSchemaType } from "./join/Cyclical";
import { joinOrdinary, joinOrdinarySchemaType } from "./join/Ordinary";

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
        path: "room/join/cyclical",
        handler: joinCyclical,
        auth: true,
        schema: joinCyclicalSchemaType,
    }),
]);
