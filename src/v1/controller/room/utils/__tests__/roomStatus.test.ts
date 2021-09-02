import test from "ava";
import { roomIsIdle, roomIsRunning, roomNotRunning } from "../RoomStatus";
import { RoomStatus } from "../../../../../model/room/Constants";

const namespace = "[utils][utils-room][utils-room-status]";

test(`${namespace} - room is running`, ava => {
    ava.false(roomIsRunning(RoomStatus.Idle));
    ava.false(roomIsRunning(RoomStatus.Stopped));
    ava.true(roomIsRunning(RoomStatus.Started));
    ava.true(roomIsRunning(RoomStatus.Paused));
});

test(`${namespace} - room not running`, ava => {
    ava.true(roomNotRunning(RoomStatus.Idle));
    ava.true(roomNotRunning(RoomStatus.Stopped));
    ava.false(roomNotRunning(RoomStatus.Started));
    ava.false(roomNotRunning(RoomStatus.Paused));
});

test(`${namespace} - room is idle`, ava => {
    ava.true(roomIsIdle(RoomStatus.Idle));
    ava.false(roomIsIdle(RoomStatus.Stopped));
    ava.false(roomIsIdle(RoomStatus.Started));
    ava.false(roomIsIdle(RoomStatus.Paused));
});
