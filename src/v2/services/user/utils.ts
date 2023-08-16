import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { AbstractLogin } from "../../../abstract/login";
import { Whiteboard } from "../../../constants/Config";
import { FileConvertStep, FileResourceType } from "../../../model/cloudStorage/Constants";
import {
    getFilePath,
    getOSSFileURLPath,
} from "../../../v1/controller/cloudStorage/alibabaCloud/upload/Utils";
import { getDisposition, ossClient } from "../../../v1/controller/cloudStorage/alibabaCloud/Utils";
import { cloudStorageConfigsDAO, cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";

export async function setGuidePPTX(t: EntityManager, userUUID: string): Promise<void> {
    const CN = Whiteboard.convertRegion === "cn-hz";

    const fileUUID = v4();
    const name = CN ? "开始使用 Flat.pptx" : "Get Started with Flat.pptx";
    const pptxPath = getFilePath(name, fileUUID);
    const fileSize = CN ? 5027927 : 5141265;

    await ossClient.copy(pptxPath, AbstractLogin.guidePPTX, {
        headers: { "Content-Disposition": getDisposition(name) },
    });

    await Promise.all([
        cloudStorageConfigsDAO.insert(
            t,
            {
                user_uuid: userUUID,
                total_usage: String(fileSize),
            },
            {
                orUpdate: ["total_usage"],
            },
        ),
        cloudStorageFilesDAO.insert(t, {
            payload: {
                region: Whiteboard.convertRegion,
                convertStep: FileConvertStep.None,
            },
            file_url: getOSSFileURLPath(pptxPath),
            file_size: fileSize,
            file_uuid: fileUUID,
            file_name: name,
            resource_type: FileResourceType.WhiteboardProjector,
            directory_path: "/",
        }),
        cloudStorageUserFilesDAO.insert(t, {
            user_uuid: userUUID,
            file_uuid: fileUUID,
        }),
    ]);
}
