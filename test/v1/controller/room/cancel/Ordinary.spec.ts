import { describe } from "mocha";
import { expect } from "chai";
import { CancelOrdinary } from "../../../../../src/v1/controller/room/cancel/Ordinary";
import { ServiceOrdinary } from "../../../../../src/v1/service";
import { v4 } from "uuid";
import { ControllerError } from "../../../../../src/error/ControllerError";
import { Status } from "../../../../../src/constants/Project";
import { ErrorCode } from "../../../../../src/ErrorCode";
import { Logger } from "../../../../../src/logger";
import { ControllerClassParams } from "../../../../../src/abstract/controller";
import { RoomStatus } from "../../../../../src/model/room/Constants";
import { ORM } from "../../../../../src/utils/ORM";

describe("v1 cancel room", () => {
    const logger = new Logger<any>("test", {}, []);

    const createCancelOrdinary = (
        roomUUID: string,
        userUUID: string,
    ): ((serviceOrdinary: ServiceOrdinary) => CancelOrdinary) => {
        const orm = new ORM();
        // eslint-disable-next-line @typescript-eslint/require-await
        orm.transaction = async (cb: (_t: any) => any): Promise<any> => {
            cb("");
        };

        return serviceOrdinary => {
            const controllerClassParams = {
                logger,
                req: {
                    body: {
                        roomUUID,
                    },
                    user: {
                        userUUID,
                    },
                },
                reply: {},
            } as ControllerClassParams;

            return new CancelOrdinary(controllerClassParams, {
                serviceOrdinary,
                orm,
            });
        };
    };

    it("room not found", async () => {
        const [roomUUID, userUUID] = [v4(), v4()];

        const serviceOrdinary = new ServiceOrdinary(roomUUID, userUUID);

        serviceOrdinary.info = (..._args: any[]): any => {
            throw new ControllerError(ErrorCode.RoomNotFound, Status.Failed);
        };

        const cancelOrdinary = createCancelOrdinary(roomUUID, userUUID)(serviceOrdinary);

        let code = NaN;

        try {
            await cancelOrdinary.execute();
        } catch (error) {
            code = cancelOrdinary.errorHandler(error).code;
        }

        expect(code).eq(ErrorCode.RoomNotFound);
    });

    it("room is periodic sub room", async () => {
        const [roomUUID, userUUID] = [v4(), v4()];

        const serviceOrdinary = new ServiceOrdinary(roomUUID, userUUID);

        serviceOrdinary.info = (..._args: any[]): any => {
            return {
                periodic_uuid: v4(),
            };
        };

        const cancelOrdinary = createCancelOrdinary(roomUUID, userUUID)(serviceOrdinary);

        let code = NaN;

        try {
            await cancelOrdinary.execute();
        } catch (error) {
            code = cancelOrdinary.errorHandler(error).code;
        }

        expect(code).eq(ErrorCode.NotPermission);
    });

    it("user is room owner and room is running", async () => {
        const [roomUUID, userUUID] = [v4(), v4()];

        const serviceOrdinary = new ServiceOrdinary(roomUUID, userUUID);

        serviceOrdinary.info = (..._args: any[]): any => {
            return {
                periodic_uuid: "",
                owner_uuid: userUUID,
                room_status: RoomStatus.Started,
            };
        };

        const cancelOrdinary = createCancelOrdinary(roomUUID, userUUID)(serviceOrdinary);

        let code = NaN;

        try {
            await cancelOrdinary.execute();
        } catch (error) {
            code = cancelOrdinary.errorHandler(error).code;
        }

        expect(code).eq(ErrorCode.RoomIsRunning);
    });

    it("student cancel room", async () => {
        const [roomUUID, userUUID] = [v4(), v4()];

        const serviceOrdinary = new ServiceOrdinary(roomUUID, userUUID);

        serviceOrdinary.info = (..._args: any[]): any => {
            return {
                periodic_uuid: "",
                owner_uuid: v4(),
                room_status: RoomStatus.Paused,
            };
        };

        serviceOrdinary.removeUser = (): any => {
            return Promise.resolve();
        };

        const cancelOrdinary = createCancelOrdinary(roomUUID, userUUID)(serviceOrdinary);

        let status: Status;

        try {
            status = (await cancelOrdinary.execute()).status;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            status = Status.Failed;
        }

        expect(status).eq(Status.Success);
    });

    it("owner cancel room", async () => {
        const [roomUUID, userUUID] = [v4(), v4()];

        const serviceOrdinary = new ServiceOrdinary(roomUUID, userUUID);

        serviceOrdinary.info = (..._args: any[]): any => {
            return {
                periodic_uuid: "",
                owner_uuid: userUUID,
                room_status: RoomStatus.Idle,
            };
        };

        serviceOrdinary.removeUser = (): any => {
            return Promise.resolve();
        };

        serviceOrdinary.remove = (): any => {
            return Promise.resolve();
        };

        const cancelOrdinary = createCancelOrdinary(roomUUID, userUUID)(serviceOrdinary);

        let status: Status;

        try {
            status = (await cancelOrdinary.execute()).status;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            status = Status.Failed;
        }

        expect(status).eq(Status.Success);
    });
});
