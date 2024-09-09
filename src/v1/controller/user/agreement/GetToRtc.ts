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
        const listMap:Map<string, boolean> = new Map();
        const length = rtcUids.length;
        if (length > 0) {
            let i = 0;
            const batchQueryRtcUids: string[][] = [];
            while (i < length) {
                const j = i + 50;
                batchQueryRtcUids.push(rtcUids.slice(i, j));
                i = j;   
            }
            for (const rtc_uids of batchQueryRtcUids) {
                const roomUsersInfos = await dataSource
                    .createQueryBuilder(RoomUserModel, "ru")
                    .where("ru.room_uuid = :room_uuid", {
                        room_uuid,
                    })
                    .andWhere("ru.rtc_uid IN (:...rtc_uids)", { rtc_uids })
                    .getMany();

                for (const rtc_uid of rtc_uids) {
                    listMap.set(rtc_uid, false);
                }
                const collectInfos = await dataSource
                    .createQueryBuilder(UserAgreementModel, "cInfo")
                    .where("cInfo.user_uuid IN (:...user_uuid)", { user_uuid: roomUsersInfos.map(c=> c && c.user_uuid) })
                    .getMany();
                    
                for (const rInfo of roomUsersInfos) {
                    listMap.set(rInfo.rtc_uid, true);
                    const rtc_uid = rInfo.rtc_uid;
                    const user_uuid = rInfo.user_uuid;
                    if (rtc_uid && user_uuid) {
                        const cInfo = collectInfos.find(c=> c && (c.user_uuid === user_uuid));
                        if (cInfo) {
                            listMap.set(rtc_uid, cInfo.is_agree_collect_data);
                        }
                    }
                }
            }
        }
        return {
            status: Status.Success,
            data: Object.fromEntries(listMap)
        } 
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
