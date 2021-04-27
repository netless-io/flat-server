import { Controller, FastifySchema } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { DocsType, RoomStatus, RoomType } from "../../../../model/room/Constants";
import { RoomDAO, RoomDocDAO, RoomUserDAO, UserDAO } from "../../../../dao";
import { parseError } from "../../../../Logger";

export const ordinaryInfo: Controller<OrdinaryInfoRequest, OrdinaryInfoResponse> = async ({
    req,
    logger,
}) => {
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
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface OrdinaryInfoRequest {
    body: {
        roomUUID: string;
        needDocs: boolean;
    };
}

export const OrdinaryInfoSchemaType: FastifySchema<OrdinaryInfoRequest> = {
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
