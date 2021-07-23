import { RoomDAO } from "../../../dao";
import { RoomModel } from "../../../model/room/Room";
import { ControllerError } from "../../../error/ControllerError";
import { Region, Status } from "../../../constants/Project";
import { ErrorCode } from "../../../ErrorCode";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { RoomStatus, RoomType } from "../../../model/room/Constants";
import { whiteboardCreateRoom } from "../../utils/request/whiteboard/WhiteboardRequest";
import { addHours, toDate } from "date-fns/fp";
import { InsertResult } from "typeorm/query-builder/result/InsertResult";

export class ServiceRoom {
    constructor(private readonly roomUUID: string, private readonly userUUID: string) {}

    public async assertExist(errorCode: ErrorCode = ErrorCode.RoomNotFound): Promise<void> {
        const result = await RoomDAO().findOne(["id"], {
            room_uuid: this.roomUUID,
        });

        if (!result) {
            throw new ControllerError(errorCode, Status.Failed);
        }
    }

    public async assertInfo<T extends keyof RoomModel = keyof RoomModel>(
        field: T[],
        errorCode: ErrorCode = ErrorCode.RoomNotFound,
    ): Promise<Pick<RoomModel, T>> {
        const result = await RoomDAO().findOne(field, {
            room_uuid: this.roomUUID,
        });

        if (result) {
            return result;
        }

        throw new ControllerError(errorCode, Status.Failed);
    }

    public async assertInfoByOwner<T extends keyof RoomModel = keyof RoomModel>(
        field: T[],
        errorCode: ErrorCode = ErrorCode.RoomNotFound,
    ): Promise<Pick<RoomModel, T>> {
        const result = await RoomDAO().findOne(field, {
            room_uuid: this.roomUUID,
            owner_uuid: this.userUUID,
        });

        if (result) {
            return result;
        }

        throw new ControllerError(errorCode, Status.Failed);
    }

    public async create(
        data: {
            title: string;
            type: RoomType;
            region: Region;
            beginTime: number | Date;
            endTime?: number | Date;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { title, type, region, beginTime, endTime } = data;
        return await RoomDAO(t).insert({
            periodic_uuid: "",
            owner_uuid: this.userUUID,
            title,
            room_type: type,
            room_status: RoomStatus.Idle,
            room_uuid: this.roomUUID,
            whiteboard_room_uuid: await whiteboardCreateRoom(region),
            begin_time: toDate(beginTime),
            end_time: endTime ? toDate(endTime) : addHours(1, beginTime),
            region,
        });
    }

    public remove(t?: EntityManager): Promise<UpdateResult> {
        return RoomDAO(t).remove({
            room_uuid: this.roomUUID,
            owner_uuid: this.userUUID,
        });
    }
}
