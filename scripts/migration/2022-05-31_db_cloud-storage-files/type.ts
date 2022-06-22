import { RowDataPacket } from "mysql2/promise";

export interface Config {
    MYSQL_HOST: string;
    MYSQL_PORT: number;
    MYSQL_USERNAME: string;
    MYSQL_PASSWORD: string;
    MYSQL_DATABASE: string;
}

export interface IFindData {
    id: number;
    file_name: string;
    file_url: string;
    convert_step: string;
    task_uuid: string;
    task_token: string;
    region: string;
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
