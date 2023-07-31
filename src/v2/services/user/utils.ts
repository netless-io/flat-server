import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { AbstractLogin } from "../../../abstract/login";
import { Region } from "../../../constants/Project";
import { FileConvertStep, FileResourceType } from "../../../model/cloudStorage/Constants";
import {
    getFilePath,
    getOSSFileURLPath,
} from "../../../v1/controller/cloudStorage/alibabaCloud/upload/Utils";
import { getDisposition, ossClient } from "../../../v1/controller/cloudStorage/alibabaCloud/Utils";
import { cloudStorageConfigsDAO, cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../dao";

export async function setGuidePPTX(t: EntityManager, userUUID: string): Promise<void> {
    const [cnFileUUID, enFileUUID] = [v4(), v4()];
    const [cnName, enName] = ["开始使用 Flat.pptx", "Get Started with Flat.pptx"];
    const [cnPPTXPath, enPPTXPath] = [
        getFilePath(cnName, cnFileUUID),
        getFilePath(enName, enFileUUID),
    ];
    const [cnFileSize, enFileSize] = [5027927, 5141265];

    await Promise.all([
        ossClient.copy(cnPPTXPath, AbstractLogin.guidePPTX, {
            headers: { "Content-Disposition": getDisposition(cnName) },
        }),
        ossClient.copy(enPPTXPath, AbstractLogin.guidePPTX, {
            headers: { "Content-Disposition": getDisposition(enName) },
        }),
    ]);

    await Promise.all([
        cloudStorageConfigsDAO.insert(
            t,
            {
                user_uuid: userUUID,
                total_usage: String(cnFileSize + enFileSize),
            },
            {
                orUpdate: ["total_usage"],
            },
        ),
        cloudStorageFilesDAO.insert(t, {
            payload: {
                region: Region.CN_HZ,
                convertStep: FileConvertStep.None,
            },
            fileURL: getOSSFileURLPath(cnPPTXPath),
            fileSize: cnFileSize,
            fileUUID: cnFileUUID,
            fileName: cnName,
            resourceType: FileResourceType.WhiteboardProjector,
        }),
        cloudStorageFilesDAO.insert(t, {
            payload: {
                region: Region.US_SV,
                convertStep: FileConvertStep.None,
            },
            fileURL: getOSSFileURLPath(enPPTXPath),
            fileSize: enFileSize,
            fileUUID: enFileUUID,
            fileName: enName,
            resourceType: FileResourceType.WhiteboardProjector,
        }),
        cloudStorageUserFilesDAO.insert(t, {
            user_uuid: userUUID,
            file_uuid: cnFileUUID,
        }),
        cloudStorageUserFilesDAO.insert(t, {
            user_uuid: userUUID,
            file_uuid: enFileUUID,
        }),
    ]);
}
