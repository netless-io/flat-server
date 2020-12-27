import { DocsType, Week } from "./Constants";

export interface Docs {
    type: DocsType;
    uuid: string;
}

export interface Periodic {
    weeks: Week[];
    rate?: number;
    endTime?: number;
}
