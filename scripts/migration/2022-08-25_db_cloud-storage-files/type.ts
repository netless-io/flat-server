import { RowDataPacket } from "mysql2/promise";

export interface Config {
    MYSQL_HOST: string;
    MYSQL_PORT: number;
    MYSQL_USERNAME: string;
    MYSQL_PASSWORD: string;
    MYSQL_DATABASE: string;
}

export interface IFindData {
    file_uuid: string;
    file_size: number;
    is_delete: number;
}

export interface IFindDataPacket extends IFindData, RowDataPacket {}

export type ITransformData = {
    id: number;
    resourceType: string;
    payload:
        | {
              region: string;
              convertStep: string;
          }
        | {
              region: string;
              convertStep: string;
              taskUUID: string;
              taskToken: string;
          }
        | {
              region: string;
          }
        | {};
};
