import { FastifyRoutes } from "../../types/Server";
import { create, createSchemaType } from "./create";
import { schedule, scheduleSchemaType } from "./schedule";
import { list, listSchemaType } from "./list";

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
]);
