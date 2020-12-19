import { DocsType, Week } from "./Constants";

export interface Docs {
    type: DocsType;
    uuid: string;
}

export type Cyclical = {
    weeks: Week[];
    rate?: number;
    endTime?: number;
};
