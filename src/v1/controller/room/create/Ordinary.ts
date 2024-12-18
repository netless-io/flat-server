import { RoomType } from "../../../../model/room/Constants";
import { Region, Status } from "../../../../constants/Project";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ErrorCode } from "../../../../ErrorCode";
import {
    beginTimeGreaterThanEndTime,
    timeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";
import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { ControllerError } from "../../../../error/ControllerError";
import { ServiceRoom, ServiceRoomUser } from "../../../service";
import { ServiceUserPmi } from "../../../service/user/UserPmi";
import { generateRoomInviteCode, generateRoomUUID } from "./Utils";
import { rtcQueue } from "../../../queue";
import { aliGreenText } from "../../../utils/AliGreen";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { parseError } from "../../../../logger";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/create/ordinary",
    auth: true,
})
export class CreateOrdinary extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["title", "type"],
            properties: {
                title: {
                    type: "string",
                    maxLength: 50,
                },
                type: {
                    type: "string",
                    enum: [RoomType.OneToOne, RoomType.SmallClass, RoomType.BigClass],
                },
                beginTime: {
                    type: "integer",
                    format: "unix-timestamp",
                    nullable: true,
                },
                endTime: {
                    type: "integer",
                    format: "unix-timestamp",
                    nullable: true,
                },
                region: {
                    type: "string",
                    enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
                    nullable: true,
                },
                pmi: {
                    type: "boolean",
                    nullable: true,
                },
                isAI: {
                    type: "boolean",
                    nullable: true,
                },
            },
        },
    };

    public readonly svc: {
        userPmi: ServiceUserPmi;
        room: ServiceRoom;
        roomUser: ServiceRoomUser;
    };

    private readonly roomUUID: string = generateRoomUUID();

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            userPmi: new ServiceUserPmi(this.userUUID),
            room: new ServiceRoom(this.roomUUID, this.userUUID),
            roomUser: new ServiceRoomUser(this.roomUUID, this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        await this.checkParams();

        // If request PMI and exist one room that uses PMI, reject.
        if (this.body.pmi) {
            const pmiInUse = await this.svc.userPmi.existsRoom();
            if (pmiInUse) {
                throw new ControllerError(ErrorCode.RoomExists);
            }
        }

        let inviteCode: string | undefined;

        await dataSource.transaction(async t => {
            // prettier-ignore
            await Promise.all([
                this.svc.room.create(this.body, t),
                this.svc.roomUser.addSelf(t)
            ]);

            if (this.body.pmi) {
                inviteCode = await this.svc.userPmi.getOrCreate(t);
            }
        });

        rtcQueue(this.roomUUID, 0);

        // is PMI, save it in redis
        if (inviteCode) {
            await RedisService.client
                .multi()
                .set(RedisKey.roomInviteCode(inviteCode), this.roomUUID)
                .set(RedisKey.roomInviteCodeReverse(this.roomUUID), inviteCode)
                .exec()
                .then(data => {
                    for (let i = 0; i < data.length; ++i) {
                        const [error, result] = data[i];
                        if (error !== null || result === null) {
                            throw (
                                error || new Error(`already exists redis key, failed index: ${i}`)
                            );
                        }
                    }
                })
                .catch(error => {
                    inviteCode = this.roomUUID;
                    this.logger.warn("set room invite code to redis failed", parseError(error));
                });
        } else {
            inviteCode = await generateRoomInviteCode("ordinary", this.roomUUID, this.logger);
        }

        return {
            status: Status.Success,
            data: {
                roomUUID: this.roomUUID,
                inviteCode,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private async checkParams(): Promise<void> {
        const { beginTime: beginTime_, endTime, title } = this.body;

        // If beginTime is before 1 minute ago, it is highly possible that the client's time is wrong.
        // Set to now in that case.
        let beginTime = beginTime_;
        if (beginTime && timeExceedRedundancyOneMinute(beginTime)) {
            beginTime = Date.now();
        }

        if (endTime) {
            if (!beginTime) {
                throw new ControllerError(ErrorCode.ParamsCheckFailed);
            }

            if (beginTimeGreaterThanEndTime(beginTime, endTime)) {
                throw new ControllerError(ErrorCode.ParamsCheckFailed);
            }

            if (timeIntervalLessThanFifteenMinute(beginTime, endTime)) {
                throw new ControllerError(ErrorCode.ParamsCheckFailed);
            }
        }

        if (await aliGreenText.textNonCompliant(title)) {
            throw new ControllerError(ErrorCode.NonCompliant);
        }
    }
}

export interface RequestType {
    body: {
        title: string;
        type: RoomType;
        beginTime?: number;
        endTime?: number;
        region?: Region;
        pmi?: boolean;
        isAI?: boolean;
    };
}

export interface ResponseType {
    roomUUID: string;
    inviteCode: string;
}
