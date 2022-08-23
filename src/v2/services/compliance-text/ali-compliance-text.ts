import { createLoggerService } from "../../../logger";
import { Censorship } from "../../../constants/Config";
import { ax } from "../../../v1/utils/Axios";
import { createHash, createHmac } from "crypto";
import { v4 } from "uuid";
import { ComplianceTextAbstract } from "../../service-locator/service/compliance-text-abstract";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class AliComplianceTextService extends ComplianceTextAbstract {
    private static greenVersion = "2017-01-12";

    private readonly logger = createLoggerService<"AliComplianceText">({
        serviceName: "AliComplianceText",
        ids: this.ids,
    });

    public constructor(private readonly ids: IDS) {
        super();
    }

    public async textNormal(text: string): Promise<boolean> {
        if (!Censorship.text.enable) {
            return true;
        }

        const requestBody = {
            scenes: ["antispam"],
            tasks: [
                {
                    content: text,
                },
            ],
        };
        const path = "/green/text/scan";

        const headers = this.headers(requestBody, path);

        return await ax
            .post<AliTextResp>(`https://${Censorship.text.aliCloud.endpoint}${path}`, requestBody, {
                headers,
            })
            .then(({ data }) => {
                for (const item of data.data[0].results) {
                    if (
                        item.suggestion === "block" &&
                        ["politics", "terrorism", "abuse", "porn", "contraband"].includes(
                            item.label,
                        )
                    ) {
                        this.logger.debug("text compliance result", {
                            AliComplianceText: {
                                text,
                                label: item.label,
                            },
                        });

                        return false;
                    }
                }

                return true;
            })
            .catch(() => true);
    }

    public async assertTextNormal(text: string): Promise<void> {
        const result = await this.textNormal(text);

        if (!result) {
            throw new FError(ErrorCode.NonCompliant);
        }
    }

    private headers(requestBody: Record<string, any>, path: string): Record<string, string> {
        const gmtCreate = new Date().toUTCString();
        const md5 = createHash("md5");

        const basicHeader = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Content-MD5": md5.update(JSON.stringify(requestBody)).digest().toString("base64"),
            Date: gmtCreate,
            "x-acs-version": AliComplianceTextService.greenVersion,
            "x-acs-signature-nonce": v4(),
            "x-acs-signature-version": "1.0",
            "x-acs-signature-method": "HMAC-SHA1",
        };

        const raw = [
            "POST",
            "application/json",
            basicHeader["Content-MD5"],
            "application/json",
            basicHeader["Date"],
            `x-acs-signature-method:${basicHeader["x-acs-signature-method"]}`,
            `x-acs-signature-nonce:${basicHeader["x-acs-signature-nonce"]}`,
            `x-acs-signature-version:${basicHeader["x-acs-signature-version"]}`,
            `x-acs-version:${basicHeader["x-acs-version"]}`,
            path,
        ];

        const authorization = createHmac("sha1", Censorship.text.aliCloud.accessSecret)
            .update(raw.join("\n"))
            .digest()
            .toString("base64");

        return {
            ...basicHeader,
            Authorization: `acs ${Censorship.text.aliCloud.accessID}:${authorization}`,
        };
    }
}

type AliTextResp = {
    code: number;
    data: [
        {
            code: number;
            results: Array<{
                label: string;
                rate: number;
                scene: string;
                suggestion: string;
            }>;
        },
    ];
};
