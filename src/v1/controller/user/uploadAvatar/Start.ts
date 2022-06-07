import { v4 } from "uuid";
import { AbstractController } from "../../../../abstract/controller";
import { User } from "../../../../constants/Config";
import { Region, Status } from "../../../../constants/Project";
import { Controller } from "../../../../decorator/Controller";
import RedisService from "../../../../thirdPartyService/RedisService";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RedisKey } from "../../../../utils/Redis";
import { getOSSDomain } from "../../cloudStorage/alibabaCloud/upload/Utils";
import { policyTemplate } from "../../cloudStorage/alibabaCloud/Utils";
import { getFilePath } from "./Utils";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/upload-avatar/start",
    auth: true,
})
export class UploadAvatarStart extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileName", "region"],
            properties: {
                fileName: {
                    type: "string",
                    format: "avatar-suffix",
                    maxLength: 128,
                },
                fileSize: {
                    type: "number",
                    minimum: 1,
                    maximum: User.avatar.size,
                },
                region: {
                    type: "string",
                    enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileName, fileSize, region } = this.body;
        const userUUID = this.userUUID;

        const fileUUID = v4();
        const filePath = getFilePath(fileName, userUUID, fileUUID);
        const { policy, signature } = policyTemplate(fileName, filePath, fileSize, region);

        await RedisService.hmset(
            RedisKey.userAvatarFileInfo(userUUID, fileUUID),
            {
                fileName,
                fileSize: String(fileSize),
                region,
            },
            60 * 60,
        );

        return {
            status: Status.Success,
            data: {
                fileUUID,
                filePath,
                policy,
                policyURL: getOSSDomain(region),
                signature,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        fileName: string;
        fileSize: number;
        region: Region;
    };
}

interface ResponseType {
    fileUUID: string;
    filePath: string;
    policy: string;
    policyURL: string;
    signature: string;
}
