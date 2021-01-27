import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { DocsType, RoomStatus, RoomType } from "../Constants";
import {
    RoomDocDAO,
    RoomPeriodicConfigDAO,
    RoomPeriodicDAO,
    RoomPeriodicUserDAO,
} from "../../../dao";
import { LessThan, MoreThan } from "typeorm";

export const periodicSubRoomInfo = async (
    req: PatchRequest<{
        Body: PeriodicSubRoomInfoBody;
    }>,
): Response<PeriodicSubRoomInfoResponse> => {
    const { periodicUUID, roomUUID, needOtherRoomTimeInfo } = req.body;
    const { userUUID } = req.user;

    try {
        const periodicRoomUserInfo = await RoomPeriodicUserDAO().findOne(["id"], {
            periodic_uuid: periodicUUID,
            user_uuid: userUUID,
        });

        if (periodicRoomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const periodicRoomInfo = await RoomPeriodicDAO().findOne(
            ["room_status", "begin_time", "end_time"],
            {
                fake_room_uuid: roomUUID,
            },
        );

        if (periodicRoomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const { room_status, begin_time, end_time } = periodicRoomInfo;

        const periodicConfigInfo = await RoomPeriodicConfigDAO().findOne(
            ["title", "owner_uuid", "room_type"],
            {
                periodic_uuid: periodicUUID,
            },
        );

        if (periodicConfigInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const { title, owner_uuid, room_type } = periodicConfigInfo;

        const docs = (
            await RoomDocDAO().find(["doc_type", "doc_uuid", "is_preload"], {
                periodic_uuid: periodicUUID,
            })
        ).map(({ doc_type, doc_uuid, is_preload }) => {
            return {
                docType: doc_type,
                docUUID: doc_uuid,
                isPreload: is_preload,
            };
        });

        const {
            previousPeriodicRoomBeginTime,
            nextPeriodicRoomEndTime,
        } = await (async (): Promise<{
            previousPeriodicRoomBeginTime: number | null;
            nextPeriodicRoomEndTime: number | null;
        }> => {
            if (userUUID !== periodicConfigInfo.owner_uuid || !needOtherRoomTimeInfo) {
                return {
                    previousPeriodicRoomBeginTime: null,
                    nextPeriodicRoomEndTime: null,
                };
            }

            const previousPeriodicRoom = await RoomPeriodicDAO().findOne(
                ["begin_time"],
                {
                    periodic_uuid: periodicUUID,
                    begin_time: LessThan(periodicRoomInfo.begin_time),
                },
                ["begin_time", "DESC"],
            );

            const nextPeriodicRoom = await RoomPeriodicDAO().findOne(
                ["end_time"],
                {
                    periodic_uuid: periodicUUID,
                    begin_time: MoreThan(periodicRoomInfo.begin_time),
                },
                ["begin_time", "ASC"],
            );

            return {
                previousPeriodicRoomBeginTime: previousPeriodicRoom
                    ? previousPeriodicRoom.begin_time.valueOf()
                    : null,
                nextPeriodicRoomEndTime: nextPeriodicRoom
                    ? nextPeriodicRoom.end_time.valueOf()
                    : null,
            };
        })();

        return {
            status: Status.Success,
            data: {
                roomInfo: {
                    title,
                    beginTime: begin_time.valueOf(),
                    endTime: end_time.valueOf(),
                    roomType: room_type,
                    roomStatus: room_status,
                    ownerUUID: owner_uuid,
                },
                previousPeriodicRoomBeginTime,
                nextPeriodicRoomEndTime,
                count: await RoomPeriodicDAO().count({
                    periodic_uuid: periodicUUID,
                }),
                docs,
            },
        };
    } catch (e) {
        console.error(e);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface PeriodicSubRoomInfoBody {
    roomUUID: string;
    periodicUUID: string;
    needOtherRoomTimeInfo?: boolean;
}

export const periodicSubRoomInfoSchemaType: FastifySchema<{
    body: PeriodicSubRoomInfoBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID", "periodicUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
            periodicUUID: {
                type: "string",
                format: "uuid-v4",
            },
            needOtherRoomTimeInfo: {
                type: "boolean",
                nullable: true,
            },
        },
    },
};

interface PeriodicSubRoomInfoResponse {
    roomInfo: {
        title: string;
        beginTime: number;
        endTime: number;
        roomType: RoomType;
        roomStatus: RoomStatus;
        ownerUUID: string;
    };
    previousPeriodicRoomBeginTime: number | null;
    nextPeriodicRoomEndTime: number | null;
    count: number;
    docs: Array<{
        docType: DocsType;
        docUUID: string;
        isPreload: boolean;
    }>;
}
