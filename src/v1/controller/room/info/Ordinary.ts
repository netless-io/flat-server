import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { DocsType, RoomStatus, RoomType } from "../Constants";
import { RoomDAO, RoomDocDAO, RoomUserDAO, UserDAO } from "../../../dao";

export const ordinaryInfo = async (
    req: PatchRequest<{
        Body: OrdinaryInfoBody;
    }>,
): Response<OrdinaryInfoResponse> => {
    const { roomUUID, needDocs } = req.body;
    const { userUUID } = req.user;

    try {
        const roomUserInfo = await RoomUserDAO().findOne(["id"], {
            user_uuid: userUUID,
            room_uuid: roomUUID,
        });

        if (roomUserInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.RoomNotFound,
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

        const { title, begin_time, end_time, room_type, room_status, owner_uuid } = roomInfo;

        const userInfo = await UserDAO().findOne(["user_name"], {
            user_uuid: owner_uuid,
        });

        if (userInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.UserNotFound,
            };
        }

        const docs = needDocs
            ? (
                  await RoomDocDAO().find(["doc_type", "doc_uuid", "is_preload"], {
                      room_uuid: roomUUID,
                  })
              ).map(({ doc_type, doc_uuid, is_preload }) => {
                  return {
                      docType: doc_type,
                      docUUID: doc_uuid,
                      isPreload: is_preload,
                  };
              })
            : [];

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
                    ownerUserName: userInfo.user_name,
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
    needDocs: boolean;
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
            needDocs: {
                type: "boolean",
            },
        },
    },
};

interface OrdinaryInfoResponse {
    roomInfo: {
        title: string;
        beginTime: number;
        endTime: number;
        roomType: RoomType;
        roomStatus: RoomStatus;
        ownerUUID: string;
        ownerUserName: string;
    };
    docs: Array<{
        docType: DocsType;
        docUUID: string;
        isPreload: boolean;
    }>;
}
