import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { RoomDAO, RoomDocDAO } from "../../../dao";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../Constants";
import { DocsType, RoomStatus, RoomType } from "../Constants";
import { getConnection, In } from "typeorm";
import { Docs } from "../Types";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { RoomDocModel } from "../../../model/room/RoomDoc";
import { toDate } from "date-fns/fp";
import {
    beginTimeLessEndTime,
    beginTimeLessRedundancyOneMinute,
    timeIntervalLessFifteenMinute,
} from "../utils/CheckTime";

export const updateOrdinary = async (
    req: PatchRequest<{
        Body: UpdateOrdinaryBody;
    }>,
): Response<UpdateOrdinaryResponse> => {
    const { roomUUID, beginTime, endTime, title, type, docs } = req.body;
    const { userUUID } = req.user;

    {
        if (beginTimeLessRedundancyOneMinute(beginTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        if (beginTimeLessEndTime(beginTime, endTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        if (timeIntervalLessFifteenMinute(beginTime, endTime)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }
    }

    const roomInfo = await RoomDAO().findOne(["room_status"], {
        room_uuid: roomUUID,
        owner_uuid: userUUID,
    });

    if (roomInfo === undefined) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotFound,
        };
    }

    if (roomInfo.room_status !== RoomStatus.Idle) {
        return {
            status: Status.Failed,
            code: ErrorCode.RoomNotIsIdle,
        };
    }

    const roomDocs = await RoomDocDAO().find(["doc_uuid"], {
        room_uuid: roomUUID,
    });

    const docsUUIDInDB = roomDocs.map(doc => doc.doc_uuid);
    const docsUUIDInParams = docs.map(doc => doc.uuid);

    // roomDocs = [1, 2, 3, 4]
    // docsUUIDInParams = [1, 2]
    // => [3, 4]
    const willRemoveDocs = docsUUIDInDB.filter(uuid => {
        return !docsUUIDInParams.includes(uuid);
    });

    // docs = [1, 2, 3, 4]
    // docsUUIDInDB = [1,2]
    // => [3, 4]
    const willAddDocs: QueryDeepPartialEntity<RoomDocModel>[] = (() => {
        const result: QueryDeepPartialEntity<RoomDocModel>[] = [];

        docs.forEach(({ uuid, type }) => {
            if (!docsUUIDInDB.includes(uuid)) {
                result.push({
                    doc_type: type,
                    doc_uuid: uuid,
                    room_uuid: roomUUID,
                    periodic_uuid: "",
                    is_preload: false,
                });
            }
        });

        return result;
    })();

    try {
        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                RoomDAO(t).update(
                    {
                        title,
                        begin_time: toDate(beginTime),
                        end_time: toDate(endTime),
                        room_type: type,
                    },
                    {
                        room_uuid: roomUUID,
                    },
                ),
                RoomDocDAO(t).insert(willAddDocs),
                RoomDocDAO(t).remove({
                    room_uuid: roomUUID,
                    doc_uuid: In(willRemoveDocs),
                }),
            );

            return Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface UpdateOrdinaryBody {
    roomUUID: string;
    beginTime: number;
    endTime: number;
    title: string;
    type: RoomType;
    docs: Docs[];
}

export const updateOrdinarySchemaType: FastifySchema<{
    body: UpdateOrdinaryBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID", "beginTime", "endTime", "title", "type", "docs"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
            beginTime: {
                type: "number",
                format: "unix-timestamp",
            },
            endTime: {
                type: "number",
                format: "unix-timestamp",
            },
            title: {
                type: "string",
            },
            type: {
                type: "string",
                enum: [RoomType.SmallClass, RoomType.BigClass, RoomType.OneToOne],
                maxLength: 50,
            },
            docs: {
                type: "array",
                nullable: true,
                items: {
                    type: "object",
                    required: ["type", "uuid"],
                    properties: {
                        type: {
                            type: "string",
                            enum: [DocsType.Dynamic, DocsType.Static],
                        },
                        uuid: {
                            type: "string",
                        },
                    },
                },
                maxItems: 10,
            },
        },
    },
};

interface UpdateOrdinaryResponse {}
