/**
 * @link: https://github.com/netless-io/netless-token/blob/master/Node/TypeScript/src/index.ts
 */

import { createHmac } from "crypto";
import { v1 as uuidv1 } from "uuid";
import { Whiteboard } from "../constants/Config";

export enum TokenRole {
    Admin = "0",
    Writer = "1",
    Reader = "2",
}

export enum TokenPrefix {
    SDK = "NETLESSSDK_",
    ROOM = "NETLESSROOM_",
    TASK = "NETLESSTASK_",
}

const bufferToBase64 = (buffer: Buffer): string => {
    return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const formatJSON = <T extends StrAndIntByObj>(object: T): StrByObj => {
    const keys = Object.keys(object).sort();
    const target: StrByObj = {};

    for (const key of keys) {
        target[key] = String(object[key]);
    }
    return target;
};

const stringify = (object: StrByObj): string => {
    return Object.keys(object)
        .map(key => {
            const value = object[key];

            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join("&");
};

const createToken = <T extends SdkTokenTags | RoomTokenTags>(
    prefix: TokenPrefix,
): ((accessKey: string, secretAccessKey: string, lifespan: number, content: T) => string) => {
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

        const information = JSON.stringify(formatJSON(object));
        const hmac = createHmac("sha256", secretAccessKey);
        object.sig = hmac.update(information).digest("hex");

        const query = stringify(formatJSON(object));
        const buffer = Buffer.from(query, "utf8");

        return prefix + bufferToBase64(buffer);
    };
};

const sdkToken = createToken<SdkTokenTags>(TokenPrefix.SDK);

const roomToken = createToken<RoomTokenTags>(TokenPrefix.ROOM);

const taskToken = createToken<RoomTokenTags>(TokenPrefix.TASK);

export const createWhiteboardSDKToken = (lifespan = 1000 * 60 * 10): string => {
    return sdkToken(Whiteboard.accessKey, Whiteboard.secretAccessKey, lifespan, {
        role: TokenRole.Admin,
    });
};

export const createWhiteboardRoomToken = (
    whiteboardRoomUUID: string,
    { readonly = false, lifespan = 0 }: { readonly?: boolean; lifespan?: number } = {},
): string => {
    return roomToken(Whiteboard.accessKey, Whiteboard.secretAccessKey, lifespan, {
        uuid: whiteboardRoomUUID,
        role: readonly ? TokenRole.Reader : TokenRole.Writer,
    });
};

export const createWhiteboardTaskToken = (
    whiteboardTaskUUID: string,
    { lifespan = 0 }: { lifespan?: number } = {},
): string => {
    return taskToken(Whiteboard.accessKey, Whiteboard.secretAccessKey, lifespan, {
        uuid: whiteboardTaskUUID,
        role: TokenRole.Reader,
    });
};

interface SdkTokenTags {
    readonly role: TokenRole;
}

interface RoomTokenTags {
    readonly uuid: string;
    readonly role: TokenRole;
}

type StrAndIntByObj = Record<string, string | number>;
type StrByObj = Record<string, string>;
