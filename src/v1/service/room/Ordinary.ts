import { RoomDAO, RoomUserDAO } from "../../../dao";
import { RoomModel } from "../../../model/room/Room";
import { ControllerError } from "../../../error/ControllerError";
import { Status } from "../../../constants/Project";
import { ErrorCode } from "../../../ErrorCode";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";

export class ServiceOrdinary {
    constructor(private readonly roomUUID: string, private readonly userUUID: string) {}

    public async existAssert(errorCode: ErrorCode = ErrorCode.RoomNotFound): Promise<void> {
        const result = await RoomDAO().findOne(["id"], {
            room_uuid: this.roomUUID,
        });

        if (!result) {
            throw new ControllerError(errorCode, Status.Failed);
        }
    }

    public async info<T extends keyof RoomModel = keyof RoomModel>(
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

    public async infoByOwner<T extends keyof RoomModel = keyof RoomModel>(
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

    public removeUser(t?: EntityManager): Promise<UpdateResult> {
        return RoomUserDAO(t).remove({
            room_uuid: this.roomUUID,
            user_uuid: this.userUUID,
        });
    }

    public remove(t?: EntityManager): Promise<any> {
        return RoomDAO(t).remove({
            room_uuid: this.roomUUID,
            owner_uuid: this.userUUID,
        });
    }
}
