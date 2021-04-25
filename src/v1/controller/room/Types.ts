import { DocsType, Week } from "../../../model/room/Constants";

export interface Docs {
    type: DocsType;
    uuid: string;
}

export interface Periodic {
    weeks: Week[];
    rate?: number;
    endTime?: number;
}
