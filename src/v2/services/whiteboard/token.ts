import { v1 as uuidv1 } from "uuid";
import { createHmac } from "crypto";
import { Whiteboard } from "../../../constants/Config";

enum TokenRole {
    Admin = "0",
    Writer = "1",
    Reader = "2",
}

enum TokenPrefix {
    SDK = "NETLESSSDK_",
    ROOM = "NETLESSROOM_",
    TASK = "NETLESSTASK_",
}

export class WhiteboardTokenService {
    private static sdk = WhiteboardTokenService.createToken<SDKTokenTags>(TokenPrefix.SDK);
    private static room = WhiteboardTokenService.createToken<RoomTokenTags>(TokenPrefix.ROOM);
    private static task = WhiteboardTokenService.createToken<TaskTokenTags>(TokenPrefix.TASK);

    public static createSDK(lifespan = 1000 * 60 * 10): string {
        return WhiteboardTokenService.sdk(
            Whiteboard.accessKey,
            Whiteboard.secretAccessKey,
            lifespan,
            {
                role: TokenRole.Admin,
            },
        );
    }

    public static createRoom(
        whiteboardRoomUUID: string,
        { readonly = false, lifespan = 0 }: { readonly?: boolean; lifespan?: number } = {},
    ): string {
        return WhiteboardTokenService.room(
            Whiteboard.accessKey,
            Whiteboard.secretAccessKey,
            lifespan,
            {
                uuid: whiteboardRoomUUID,
                role: readonly ? TokenRole.Reader : TokenRole.Writer,
            },
        );
    }

    public static createTask(whiteboardTaskUUID: string, lifespan = 0): string {
        return WhiteboardTokenService.task(
            Whiteboard.accessKey,
            Whiteboard.secretAccessKey,
            lifespan,
            {
                uuid: whiteboardTaskUUID,
                role: TokenRole.Reader,
            },
        );
    }

    private static bufferToBase64(buffer: Buffer): string {
        return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    private static formatJSON<T extends StrAndIntByObj>(object: T): StrByObj {
        const keys = Object.keys(object).sort();
        const target: StrByObj = {};

        for (const key of keys) {
            target[key] = String(object[key]);
        }
        return target;
    }

    private static stringify(object: StrByObj): string {
        return Object.keys(object)
            .map(key => {
                const value = object[key];

                return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join("&");
    }

    private static createToken<T extends SDKTokenTags | RoomTokenTags | TaskTokenTags>(
        prefix: TokenPrefix,
    ): (accessKey: string, secretAccessKey: string, lifespan: number, content: T) => string {
        return (accessKey: string, secretAccessKey: string, lifespan: number, content: T) => {
            // @ts-ignore
            const object: StrAndIntByObj = {
                ...content,
                ak: accessKey,
                nonce: uuidv1(),
            };

            if (lifespan > 0) {
                object.expireAt = `${Date.now() + lifespan}`;
            }

            const information = JSON.stringify(WhiteboardTokenService.formatJSON(object));
            const hmac = createHmac("sha256", secretAccessKey);
            object.sig = hmac.update(information).digest("hex");

            const query = WhiteboardTokenService.stringify(
                WhiteboardTokenService.formatJSON(object),
            );
            const buffer = Buffer.from(query, "utf8");

            return prefix + WhiteboardTokenService.bufferToBase64(buffer);
        };
    }
}

interface SDKTokenTags {
    readonly role: TokenRole;
}

interface RoomTokenTags {
    readonly uuid: string;
    readonly role: TokenRole;
}

interface TaskTokenTags {
    readonly uuid: string;
    readonly role: TokenRole;
}

type StrAndIntByObj = Record<string, string | number>;
type StrByObj = Record<string, string>;
