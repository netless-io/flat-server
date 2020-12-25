/**
 * @link: https://github.com/netless-io/netless-token/blob/master/Node/TypeScript/src/index.ts
 */

import { createHmac } from "crypto";
import { v1 as uuidv1 } from "uuid";
import { Netless } from "../Constants";

export enum TokenRole {
    Admin = "0",
    Writer = "1",
    Reader = "2",
}

export enum TokenPrefix {
    SDK = "NETLESSSDK_",
    ROOM = "NETLESSROOM_",
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

            if (value === undefined) {
                return "";
            }

            if (value === null) {
                return "null";
            }

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

export const createWhiteboardSDKToken = (lifespan = 0): string => {
    return sdkToken(Netless.ACCESS_KEY, Netless.SECRET_ACCESS_KEY, lifespan, {
        role: TokenRole.Admin,
    });
};

export const createWhiteboardRoomToken = (whiteboardRoomUUID: string, lifespan = 0): string => {
    return roomToken(Netless.ACCESS_KEY, Netless.SECRET_ACCESS_KEY, lifespan, {
        uuid: whiteboardRoomUUID,
        role: TokenRole.Writer,
    });
};

type SdkTokenTags = {
    readonly role: TokenRole;
};

type RoomTokenTags = {
    readonly uuid: string;
    readonly role: TokenRole;
};

type StrAndIntByObj = Record<string, string | number>;
type StrByObj = Record<string, string>;
