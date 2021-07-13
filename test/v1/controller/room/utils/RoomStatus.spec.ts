import { describe } from "mocha";
import { expect } from "chai";
import {
    roomIsIdle,
    roomIsRunning,
    roomNotRunning,
} from "../../../../../src/v1/controller/room/utils/RoomStatus";
import { RoomStatus } from "../../../../../src/model/room/Constants";

describe("V1 Controller RoomStatus Utils", () => {
    it("room is running", () => {
        expect(roomIsRunning(RoomStatus.Idle)).false;
        expect(roomIsRunning(RoomStatus.Stopped)).false;
        expect(roomIsRunning(RoomStatus.Started)).true;
        expect(roomIsRunning(RoomStatus.Paused)).true;
    });

    it("room not running", () => {
        expect(roomNotRunning(RoomStatus.Idle)).true;
        expect(roomNotRunning(RoomStatus.Stopped)).true;
        expect(roomNotRunning(RoomStatus.Started)).false;
        expect(roomNotRunning(RoomStatus.Paused)).false;
    });

    it("room is idle", () => {
        expect(roomIsIdle(RoomStatus.Idle)).true;
        expect(roomIsIdle(RoomStatus.Stopped)).false;
        expect(roomIsIdle(RoomStatus.Started)).false;
        expect(roomIsIdle(RoomStatus.Paused)).false;
    });
});
