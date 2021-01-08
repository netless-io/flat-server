import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { DefaultDatetime, Status } from "../../../../Constants";
import { isEqual } from "date-fns/fp";
import { ErrorCode } from "../../../../ErrorCode";
import { DocsType, RoomStatus, RoomType } from "../Constants";
import { RoomDAO, RoomDocDAO, RoomUserDAO } from "../../../dao";

export const ordinaryInfo = async (
    req: PatchRequest<{
        Body: OrdinaryInfoBody;
    }>,
): Response<OrdinaryInfoResponse> => {
    const { roomUUID } = req.body;
    const { userUUID } = req.user;

    try {
        const checkUserExistRoom = await RoomUserDAO().findOne(["id"], {
            user_uuid: userUUID,
            room_uuid: roomUUID,
        });

        if (checkUserExistRoom === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.NotPermission,
            };
        }

        const roomInfo = await RoomDAO().findOne(
            ["title", "begin_time", "end_time", "room_type", "room_status", "owner_uuid"],
            {
                room_uuid: roomUUID,
            },
        );

        if (roomInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
            };
        }

        const docs = (
            await RoomDocDAO().find(["doc_type", "doc_uuid", "is_preload"], {
                room_uuid: roomUUID,
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
                    title: roomInfo.title,
                    beginTime: roomInfo.begin_time,
                    endTime: isEqual(roomInfo.end_time)(DefaultDatetime)
                        ? ""
                        : roomInfo.end_time.toISOString(),
                    roomType: roomInfo.room_type,
                    roomStatus: roomInfo.room_status,
                    ownerUUID: roomInfo.owner_uuid,
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

interface OrdinaryInfoBody {
    roomUUID: string;
}

export const OrdinaryInfoSchemaType: FastifySchema<{
    body: OrdinaryInfoBody;
}> = {
    body: {
        type: "object",
        required: ["roomUUID"],
        properties: {
            roomUUID: {
                type: "string",
                format: "uuid-v4",
            },
        },
    },
};

interface OrdinaryInfoResponse {
    roomInfo: {
        title: string;
        beginTime: Date;
        endTime: string;
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
