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

export const periodicSubRoomInfo = async (
    req: PatchRequest<{
        Body: PeriodicSubRoomInfoBody;
    }>,
): Response<PeriodicSubRoomInfoResponse> => {
    const { periodicUUID, roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const checkUserInPeriodicRoom = await RoomPeriodicUserDAO().findOne(["id"], {
            periodic_uuid: periodicUUID,
            user_uuid: userUUID,
        });

        if (checkUserInPeriodicRoom === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const roomPeriodicInfo = await RoomPeriodicDAO().findOne(
            ["room_status", "begin_time", "end_time", "room_type"],
            {
                fake_room_uuid: roomUUID,
            },
        );

        if (roomPeriodicInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const { room_status, begin_time, end_time, room_type } = roomPeriodicInfo;

        const periodicConfigInfo = await RoomPeriodicConfigDAO().findOne(["title", "owner_uuid"], {
            periodic_uuid: periodicUUID,
        });

        if (periodicConfigInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.PeriodicNotFound,
            };
        }

        const { title, owner_uuid } = periodicConfigInfo;

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

        return {
            status: Status.Success,
            data: {
                roomInfo: {
                    title,
                    beginTime: begin_time,
                    endTime: end_time,
                    roomType: room_type,
                    roomStatus: room_status,
                    ownerUUID: owner_uuid,
                },
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
        },
    },
};

interface PeriodicSubRoomInfoResponse {
    roomInfo: {
        title: string;
        beginTime: Date;
        endTime: Date;
        roomType: RoomType;
        roomStatus: RoomStatus;
        ownerUUID: string;
    };
    docs: Array<{
        docType: DocsType;
        docUUID: string;
        isPreload: boolean;
    }>;
}
