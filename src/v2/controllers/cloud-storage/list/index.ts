import { Type } from "@sinclair/typebox";
import { Status } from "../../../../constants/Project";
import { FastifyReply } from "fastify";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";

export const cloudStorageListSchema = {
    body: Type.Object({
        page: Type.Integer({
            maximum: 50,
            minimum: 1,
        }),
        size: Type.Optional(
            Type.Integer({
                minimum: 1,
                maximum: 50,
                default: 50,
            }),
        ),
        order: Type.Optional(
            Type.String({
                enum: ["ASC", "DESC"],
                default: "ASC",
            }),
        ),
    }),
};

export const cloudStorageList = async (
    req: FastifyRequestTypebox<typeof cloudStorageListSchema>,
    reply: FastifyReply,
): Promise<Response> => {
    console.log(req, reply);
    return {
        status: Status.Process,
    };
};
