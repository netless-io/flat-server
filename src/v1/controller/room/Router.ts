import { create, createSchemaType } from "./create";
import { FastifyRoutes } from "../../types/Server";

export const httpRoom: Readonly<FastifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "post",
        path: "room/create",
        handler: create,
        auth: true,
        schema: createSchemaType,
    }),
]);
