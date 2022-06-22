import { AbstractController } from "../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Controller } from "../../../../../decorator/Controller";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../../dao";
import { v4 } from "uuid";
import { Status } from "../../../../../constants/Project";
import { aliGreenText } from "../../../../utils/AliGreen";
import { ControllerError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/url-cloud/add",
    auth: true,
})
export class URLCloudAdd extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileName", "url"],
            properties: {
                fileName: {
                    type: "string",
                    format: "url-file-suffix",
                    maxLength: 128,
                },
                url: {
                    type: "string",
                    format: "url",
                    maxLength: 256,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileName, url } = this.body;

        if (await aliGreenText.textNonCompliant(fileName)) {
            throw new ControllerError(ErrorCode.NonCompliant);
        }

        const fileUUID = v4();

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                CloudStorageFilesDAO(t).insert({
                    file_name: fileName,
                    file_size: 0,
                    file_url: url,
                    file_uuid: fileUUID,
                    resource_type: FileResourceType.OnlineCourseware,
                }),
            );

            commands.push(
                CloudStorageUserFilesDAO(t).insert({
                    user_uuid: this.userUUID,
                    file_uuid: fileUUID,
                }),
            );

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {
                fileUUID,
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
        url: string;
    };
}

interface ResponseType {
    fileUUID: string;
}
