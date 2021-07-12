import { RoomType } from "../../../../model/room/Constants";
import { Region, Status } from "../../../../constants/Project";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { v4 } from "uuid";
import { ErrorCode } from "../../../../ErrorCode";
import {
    timeExceedRedundancyOneMinute,
    beginTimeLessEndTime,
    timeIntervalLessThanFifteenMinute,
} from "../utils/CheckTime";
import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { ControllerError } from "../../../../error/ControllerError";
import { ServiceOrdinary } from "../../../service";
import { getConnection } from "typeorm";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "room/create/ordinary",
    auth: true,
})
export class CreateOrdinary extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["title", "type", "beginTime", "region"],
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
                },
                endTime: {
                    type: "integer",
                    format: "unix-timestamp",
                    nullable: true,
                },
                region: {
                    type: "string",
                    enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
                },
            },
        },
    };

    public readonly svc: {
        room: ServiceOrdinary;
    };

    private readonly roomUUID: string = v4();

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            room: new ServiceOrdinary(this.roomUUID, this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        this.checkParams();

        await getConnection().transaction(async t => {
            // prettier-ignore
            await Promise.all([
                this.svc.room.create(this.body, t),
                this.svc.room.addSelfUser(t)
            ]);
        });

        return {
            status: Status.Success,
            data: {
                roomUUID: this.roomUUID,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private checkParams(): void {
        const { beginTime, endTime } = this.body;
        if (timeExceedRedundancyOneMinute(beginTime)) {
            throw new ControllerError(ErrorCode.ParamsCheckFailed);
        }

        if (endTime) {
            if (beginTimeLessEndTime(beginTime, endTime)) {
                throw new ControllerError(ErrorCode.ParamsCheckFailed);
            }

            if (timeIntervalLessThanFifteenMinute(beginTime, endTime)) {
                throw new ControllerError(ErrorCode.ParamsCheckFailed);
            }
        }
    }
}

export interface RequestType {
    body: {
        title: string;
        type: RoomType;
        beginTime: number;
        endTime?: number;
        region: Region;
    };
}

export interface ResponseType {
    roomUUID: string;
}
