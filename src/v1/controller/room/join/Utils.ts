import { CloudStorageUserFilesModel } from "../../../../model/cloudStorage/CloudStorageUserFiles";
import { CloudStorageFilesModel } from "../../../../model/cloudStorage/CloudStorageFiles";
import { RoomDAO } from "../../../../dao";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

export const showGuide = async (userUUID: string, roomUUID: string): Promise<boolean> => {
    const rooms = await RoomDAO().find(
        ["room_uuid"],
        {
            owner_uuid: userUUID,
        },
        {
            limit: 2,
        },
    );

    const isFirstRoom = rooms.length === 1 && rooms[0].room_uuid === roomUUID;

    if (!isFirstRoom) {
        return false;
    }

    const guideFileNames = ["开始使用 Flat.pptx", "Get Started with Flat.pptx"];

    const hasGuidePPTX = await dataSource
        .createQueryBuilder(CloudStorageUserFilesModel, "fc")
        .select("fc.id")
        .innerJoin(CloudStorageFilesModel, "f", "fc.file_uuid = f.file_uuid")
        .where(
            `fc.user_uuid = :userUUID
                        AND f.file_name IN (:...fileNames)
                        AND fc.is_delete = :isDelete
                        AND f.is_delete = :isDelete`,
            {
                userUUID,
                fileNames: guideFileNames,
                isDelete: false,
            },
        )
        .limit(2)
        .getRawMany();

    return hasGuidePPTX.length !== 0;
};
