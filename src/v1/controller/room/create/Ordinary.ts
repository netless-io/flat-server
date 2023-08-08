import { RoomType } from "../../../../model/room/Constants";
import { Region, Status } from "../../../../constants/Project";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ErrorCode } from "../../../../ErrorCode";
import {
    beginTimeLessEndTime,
    timeExceedRedundancyOneMinute,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";
import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { ControllerError } from "../../../../error/ControllerError";
import { ServiceRoom, ServiceRoomUser } from "../../../service";
import { generateRoomInviteCode, generateRoomUUID } from "./Utils";
import { rtcQueue } from "../../../queue";
import { aliGreenText } from "../../../utils/AliGreen";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

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
            },
        },
    };

    public readonly svc: {
        room: ServiceRoom;
        roomUser: ServiceRoomUser;
    };

    private readonly roomUUID: string = generateRoomUUID();

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            room: new ServiceRoom(this.roomUUID, this.userUUID),
            roomUser: new ServiceRoomUser(this.roomUUID, this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        await this.checkParams();

        await dataSource.transaction(async t => {
            // prettier-ignore
            await Promise.all([
                this.svc.room.create(this.body, t),
                this.svc.roomUser.addSelf(t)
            ]);
        });

        rtcQueue(this.roomUUID, 0);

        return {
            status: Status.Success,
            data: {
                roomUUID: this.roomUUID,
                inviteCode: await generateRoomInviteCode(this.roomUUID, this.logger),
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private async checkParams(): Promise<void> {
        const { beginTime, endTime, title } = this.body;

        if (beginTime && timeExceedRedundancyOneMinute(beginTime)) {
            throw new ControllerError(ErrorCode.ParamsCheckFailed);
        }

        if (endTime) {
            if (!beginTime) {
                throw new ControllerError(ErrorCode.ParamsCheckFailed);
            }

            if (beginTimeLessEndTime(beginTime, endTime)) {
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
    };
}

export interface ResponseType {
    roomUUID: string;
    inviteCode: string;
}
