import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Status } from "../../../../constants/Project";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";

import { ServiceUserAgreement } from "../../../service/user/UserAgreement";
import { RoomUserModel } from "../../../../model/room/RoomUser";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { UserAgreementModel } from "./../../../../model/user/Agreement";

@Controller<RequestType, ResponseType>({
    method: "get",
    path: "private-polic/get",
    auth: false,
    skipAutoHandle: false,
    enable: true
})
export class AgreementGetToRtc extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["uid"],
            properties: {
                uid: {
                    type: "string"
                },
                room_uuid: {
                    type: "string"
                }
            },
        },
    };

    public readonly svc: {
        userAgreement: ServiceUserAgreement;
    };

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            userAgreement: new ServiceUserAgreement(this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        const rtcUidstr = this.querystring.uid;
        const room_uuid = this.querystring.room_uuid;
        const rtcUids = rtcUidstr.split(",");
        const userAgreementMap:Map<string, boolean> = new Map(rtcUids.map(rtc_uid => [rtc_uid, false]));
        const length = rtcUids.length;
        if (length > 0) {
            let i = 0;
            while (i < length) {
                const j = i + 50;
                const batchedRtcUids = rtcUids.slice(i, j);
                const roomUserInfos = await this.getRoomUserInfos(room_uuid, batchedRtcUids);
                const userUuids = roomUserInfos.map(user => user.user_uuid);
                if (userUuids.length > 0) {
                    const userAgreements = await this.getUserAgreements(userUuids);
                    for (const userInfo of roomUserInfos) {
                        const { rtc_uid, user_uuid } = userInfo;
                        const userAgreement = userAgreements.find(ua => ua.user_uuid === user_uuid);
                        if (userAgreement) {
                            userAgreementMap.set(rtc_uid, userAgreement.is_agree_collect_data);
                        } else {
                            userAgreementMap.set(rtc_uid, true);
                        }
                    }
                }
                i = j;   
            }
        }
        return {
            status: Status.Success,
            data: Object.fromEntries(userAgreementMap)
        } 
    }
    
    private async getRoomUserInfos(room_uuid: string, rtc_uids: string[]): Promise<RoomUserModel[]> {
        return dataSource
            .createQueryBuilder(RoomUserModel, "ru")
            .where("ru.room_uuid = :room_uuid", { room_uuid })
            .andWhere("ru.rtc_uid IN (:...rtc_uids)", { rtc_uids })
            .getMany();
    }
    private async getUserAgreements(userUuids: string[]): Promise<UserAgreementModel[]> {
        return dataSource
            .createQueryBuilder(UserAgreementModel, "ua")
            .where("ua.user_uuid IN (:...userUuids)", { userUuids })
            .getMany();
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    querystring: {
        uid: string;
        room_uuid: string;
    };
}

interface ResponseType {
    [key: string]: boolean;
}
