import { createHash, createHmac } from "crypto";
import { v4 } from "uuid";
import { ax } from "./Axios";
import { Censorship } from "../../constants/Config";

export class AliGreen {
    private static greenVersion = "2017-01-12";

    public constructor(
        private readonly accessID: string,
        private readonly accessSecret: string,
        private endpoint: string,
    ) {}

    public async imageScan(imageURL: string): Promise<ScanImage> {
        if (!Censorship.video.enable) {
            return { status: true, data: [] };
        }

        const requestBody = {
            scenes: ["porn", "terrorism"],
            tasks: [
                {
                    url: imageURL,
                },
            ],
        };
        const path = "/green/image/scan";

        const headers = this.headers(requestBody, path);

        return await ax
            .post<AliImageResp>(`https://${this.endpoint}${path}`, requestBody, {
                headers,
            })
            .then(({ data }) => ({
                status: true as const,
                data: data.data[0].results,
            }))
            .catch(error => ({
                status: false as const,
                error,
            }));
    }

    public async textNonCompliant(text: string): Promise<boolean> {
        if (!Censorship.text.enable) {
            return false;
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
            .post<AliTextResp>(`https://${this.endpoint}${path}`, requestBody, {
                headers,
            })
            .then(({ data }) => {
                return data.data[0].results.some(
                    item =>
                        item.suggestion === "block" &&
                        ["politics", "terrorism", "abuse", "porn", "contraband"].includes(
                            item.label,
                        ),
                );
            })
            .catch(() => false);
    }

    private headers(requestBody: Record<string, any>, path: string): Record<string, string> {
        const gmtCreate = new Date().toUTCString();
        const md5 = createHash("md5");

        const basicHeader = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Content-MD5": md5.update(JSON.stringify(requestBody)).digest().toString("base64"),
            Date: gmtCreate,
            "x-acs-version": AliGreen.greenVersion,
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

        const authorization = createHmac("sha1", this.accessSecret)
            .update(raw.join("\n"))
            .digest()
            .toString("base64");

        return {
            ...basicHeader,
            Authorization: `acs ${this.accessID}:${authorization}`,
        };
    }
}

export const aliGreenVideo = new AliGreen(
    Censorship.video.aliCloud.accessID,
    Censorship.video.aliCloud.accessSecret,
    Censorship.video.aliCloud.endpoint,
);

export const aliGreenText = new AliGreen(
    Censorship.text.aliCloud.accessID,
    Censorship.text.aliCloud.accessSecret,
    Censorship.text.aliCloud.endpoint,
);

type AliImageResp = {
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

type ScanImage =
    | {
          status: true;
          data: AliImageResp["data"]["0"]["results"];
      }
    | {
          status: false;
          error: Error;
      };

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
