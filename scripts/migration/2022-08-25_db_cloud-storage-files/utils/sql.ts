import { dataSource } from "./mysql";
import { IFindDataPacket } from "../type";

export const SQLCountByLocalAndOnlineCourseware = async () => {
    const [rows] = await dataSource.query(
        `SELECT COUNT(1) as count FROM cloud_storage_files WHERE resource_type = 'LocalCourseware' OR resource_type = 'OnlineCourseware';`,
    );
    return rows.count;
};

export const getLocalAndOnlineCoursewareData = async () => {
    const rows = (await dataSource.query(
        `SELECT * FROM cloud_storage_files WHERE resource_type = 'LocalCourseware' OR resource_type = 'OnlineCourseware';`,
    )) as IFindDataPacket[];

    const result: Record<string, number> = {};
    rows.forEach(item => {
        result[item.file_uuid] = item.is_delete === 1 ? 0 : item.file_size;
    });
    return result;
};

export const fileUUIDsToUserUUID = async (data: Record<string, number>) => {
    const uuids = Object.keys(data)
        .map(uuid => `'${uuid}'`)
        .join(", ");

    const rows = (await dataSource.query(
        `SELECT * FROM cloud_storage_user_files WHERE file_uuid IN (${uuids});`,
    )) as Array<{
        file_uuid: string;
        user_uuid: string;
    }>;

    const userFiles: Record<string, string[]> = {};
    rows.forEach(item => {
        if (userFiles[item.user_uuid] === undefined) {
            userFiles[item.user_uuid] = [];
        }

        userFiles[item.user_uuid].push(item.file_uuid);
    });

    return userFiles;
};

export const calSize = (filesInfo: Record<string, number>, userFiles: Record<string, string[]>) => {
    const result: Record<string, number> = {};

    Object.keys(userFiles).forEach(userUUID => {
        result[userUUID] = 0;

        userFiles[userUUID].forEach(fileUUID => {
            result[userUUID] += filesInfo[fileUUID];
        });
    });

    return result;
};

export const deleteLocalCoursewareByFilesTable = async (fileUUIDs: string[]) => {
    const uuids = fileUUIDs.map(uuid => `'${uuid}'`).join(", ");
    await dataSource.query(`DELETE FROM cloud_storage_files WHERE file_uuid IN (${uuids})`);
};

export const deleteData = async (userUUID: string, fileUUIDs: string[]) => {
    const uuids = fileUUIDs.map(uuid => `'${uuid}'`).join(", ");
    await dataSource.query(
        `DELETE FROM cloud_storage_user_files WHERE user_uuid = '${userUUID}' AND file_uuid IN (${uuids})`,
    );
    await dataSource.query(`DELETE FROM cloud_storage_files WHERE file_uuid IN (${uuids})`);
};

export const updateTotalSize = async (userUUID: string, totalSize: number) => {
    await dataSource.query(
        `UPDATE cloud_storage_configs SET total_usage = total_usage - ${totalSize} WHERE user_uuid = '${userUUID}'`,
    );
};
