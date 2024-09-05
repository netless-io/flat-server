import { RoomUserDAO } from "../../../../dao";
import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Status } from "../../../../constants/Project";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";

import { ServiceUserAgreement } from "../../../service/user/UserAgreement";

@Controller<RequestType, ResponseType>({
    method: "get",
    path: "private-polic/get",
    auth: false,
    skipAutoHandle: true,
})
export class AgreementGet extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        querystring: {
            type: "object",
            required: ["uid"],
            properties: {
                uid: {
                    type: "string"
                },
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
        const rtcUids = rtcUidstr.split(",");
        const listMap:Map<string, boolean> = new Map();
        if (rtcUids.length > 0) {
            for (const rtc_uid of rtcUids) {
                const roomUserInfo = await RoomUserDAO().findOne(["user_uuid"], {
                    rtc_uid,
                });
                if (roomUserInfo) {
                    const bol = await ServiceUserAgreement.hasCollectData(roomUserInfo.user_uuid);
                    if (bol) {
                        const isAgree = await ServiceUserAgreement.isAgreeCollectData(roomUserInfo.user_uuid);
                        listMap.set(rtc_uid, isAgree);
                    } else {
                        // 默认就是同意
                        listMap.set(rtc_uid, true);
                    }
                } else {
                    // 查不到用户则默认不同意
                    listMap.set(rtc_uid, false);  
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
    };
}

interface ResponseType {
    [key: string]: boolean;
}
