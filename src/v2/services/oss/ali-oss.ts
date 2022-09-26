import { OSSAbstract } from "../../service-locator/service/oss-abstract";
import path from "path";
import { aliOSSClient } from "./ali-oss-client";
import { createLoggerService } from "../../../logger";
import { addMinutes } from "date-fns/fp";
import { StorageService } from "../../../constants/Config";
import crypto from "crypto";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class AliOSSService extends OSSAbstract {
    private readonly logger = createLoggerService<"AliOSS">({
        serviceName: "AliOSS",
        ids: this.ids,
    });

    public readonly domain = `https://${StorageService.oss.bucket}.${StorageService.oss.endpoint}`;

    public constructor(private readonly ids: IDS) {
        super();
    }

    public async exists(filePath: string): Promise<boolean> {
        try {
            await aliOSSClient.head(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public async assertExists(filePath: string): Promise<void> {
        const result = await this.exists(filePath);

        if (!result) {
            this.logger.info("oss file not found", {
                AliOSS: {
                    filePath,
                },
            });
            throw new FError(ErrorCode.FileNotFound);
        }
    }

    public async remove(fileList: string | string[]): Promise<void> {
        this.logger.debug("remove file", {
            AliOSS: {
                removeFileList: Array.isArray(fileList) ? fileList.join(", ") : fileList,
            },
        });

        if (!Array.isArray(fileList)) {
            const result = await aliOSSClient.delete(this.removeDomain(fileList));

            this.logger.debug("remove file done", {
                AliOSS: {
                    removeFile: fileList,
                    removeStatus: result.res.status,
                },
            });
            return;
        }

        const list = fileList.map(file => this.removeDomain(file));

        await aliOSSClient.deleteMulti(list);

        const newOSSFilePathList: string[] = [];

        for (const filePath of list) {
            const suffix = path.extname(filePath);
            const fileUUID = path.basename(filePath, suffix);
            const fileName = `${fileUUID}${suffix}`;

            // old: PREFIX/UUID.png
            // new: PREFIX/2021-10/12/UUID/UUID.png
            if (filePath.endsWith(`${fileUUID}/${fileName}`)) {
                newOSSFilePathList.push(filePath.substring(0, filePath.length - fileName.length));
            }
        }

        if (newOSSFilePathList.length !== 0) {
            this.logger.debug("will remove directory", {
                AliOSS: {
                    newOSSFilePathList: newOSSFilePathList.join(", "),
                },
            });
        } else {
            this.logger.debug("not remove directory");
        }

        for (const directory of newOSSFilePathList) {
            await this.recursionRemove(directory);
        }
    }

    public async recursionRemove(directory: string, marker?: string): Promise<void> {
        const files = await aliOSSClient.list(
            {
                prefix: directory,
                marker: marker,
                "max-keys": 500,
            },
            {},
        );

        if (files.objects && files.objects.length !== 0) {
            const names = files.objects.map(file => file.name);
            this.logger.debug("remove files path", {
                AliOSS: {
                    removeFilesPath: names.join(", "),
                },
            });
            await aliOSSClient.deleteMulti(names);
        }

        if (!files.isTruncated) {
            return;
        }

        await this.recursionRemove(directory, files.nextMarker);
    }

    public async rename(filePath: string, newFileName: string): Promise<void> {
        await aliOSSClient.copy(filePath, filePath, {
            headers: {
                "Content-Disposition": AliOSSService.toDispositionFileNameEncode(newFileName),
            },
        });
    }

    public policyTemplate(
        fileName: string,
        filePath: string,
        fileSize: number,
        expiration = 60 * 2,
    ): {
        policy: string;
        signature: string;
    } {
        const policyString = JSON.stringify({
            expiration: addMinutes(expiration)(new Date()).toISOString(),
            conditions: [
                {
                    bucket: StorageService.oss.bucket,
                },
                ["content-length-range", fileSize, fileSize],
                ["eq", "$key", filePath],
                ["eq", "$Content-Disposition", AliOSSService.toDispositionFileNameEncode(fileName)],
            ],
        });

        const policy = Buffer.from(policyString).toString("base64");
        const signature = crypto
            .createHmac("sha1", StorageService.oss.accessKeySecret)
            .update(policy)
            .digest("base64");

        return {
            policy,
            signature,
        };
    }

    private static toDispositionFileNameEncode(str: string): string {
        const encodeFileName = encodeURIComponent(str);
        return `attachment; filename="${encodeFileName}"; filename*=UTF-8''${encodeFileName}`;
    }
}
