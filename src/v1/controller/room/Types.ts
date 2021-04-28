import { Week } from "../../../model/room/Constants";

export interface Periodic {
    weeks: Week[];
    rate?: number;
    endTime?: number;
}
