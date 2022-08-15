import { OSSAbstract } from "../../service-locator/service/oss-abstract";
import path from "path";
import { aliOSSClient } from "./ali-oss-client";
import { createLoggerService } from "../../../logger";

export class AliOSSService extends OSSAbstract {
    private readonly logger = createLoggerService<"AliOSS">({
        serviceName: "AliOSS",
        ids: this.ids,
    });

    public constructor(private readonly ids: IDS) {
        super();
    }

    // @ts-ignore
    public async remove(fileList: string | string[]): Promise<void> {
        this.logger.debug("remove file", {
            AliOSS: {
                removeFileList: Array.isArray(fileList) ? fileList.join(", ") : fileList,
            },
        });

        if (!Array.isArray(fileList)) {
            const result = await aliOSSClient.delete(fileList);

            this.logger.debug("remove file done", {
                AliOSS: {
                    removeFile: fileList,
                    removeStatus: result.status,
                },
            });
            return;
        }

        await aliOSSClient.deleteMulti(fileList);

        const newOSSFilePathList: string[] = [];

        for (const filePath of fileList) {
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
}
