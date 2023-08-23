import { isValid } from "date-fns/fp";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import Ajv, { FormatDefinition } from "ajv";
import path from "path";
import { CloudStorage, OAuth, User } from "../constants/Config";
import PhoneNumber from "awesome-phonenumber";

// link: https://github.com/ajv-validator/ajv/blob/cd7c6a8385464f818814ebb1e84cc703dc7ef02c/docs/api.md#ajvaddformatname-string-format-format-ajv
// link: https://github.com/ajv-validator/ajv-formats/blob/ce49433448384b4c0b2407adafc345e43b85f8ea/src/formats.ts#L38
const unixTimestamp: FormatDefinition<number> = {
    type: "number",
    validate: date => {
        // must be a millisecond timestamp
        if (String(date).length !== 13) {
            return false;
        }

        return isValid(date);
    },
};

const uuidV4: FormatDefinition<string> = {
    validate: uuid => {
        return uuidValidate(uuid) && uuidVersion(uuid) === 4;
    },
};

const fileSuffix: FormatDefinition<string> = {
    validate: fileName => {
        const suffix = path.extname(fileName).slice(1).toLowerCase();

        return CloudStorage.allowFileSuffix.includes(suffix);
    },
};

const avatarSuffix: FormatDefinition<string> = {
    validate: fileName => {
        const suffix = path.extname(fileName).slice(1).toLowerCase();

        return User.avatar.allowSuffix.includes(suffix);
    },
};

const tempPhotoSuffix: FormatDefinition<string> = {
    validate: fileName => {
        const suffix = path.extname(fileName).slice(1).toLowerCase();

        return CloudStorage.tempPhoto.allowSuffix.includes(suffix);
    },
};

const oauthLogoSuffix: FormatDefinition<string> = {
    validate: fileName => {
        const suffix = path.extname(fileName).slice(1).toLowerCase();

        return OAuth.logo.allowSuffix.includes(suffix);
    },
};

// link: https://github.com/ajv-validator/ajv-formats/blob/c1cb46cad79f984020a9a0ef569e9c091ce24400/src/formats.ts#L59
const urlRegex =
    /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;

const url: FormatDefinition<string> = {
    validate: urlStr => {
        return urlRegex.test(urlStr);
    },
};

const https: FormatDefinition<string> = {
    validate: urlStr => {
        return urlStr.startsWith("https://") && urlRegex.test(urlStr);
    },
};

const phone: FormatDefinition<string> = {
    validate: phone => {
        if (phone[0] !== "+") {
            return false;
        }

        const pn = new PhoneNumber(phone);

        return pn.isValid();
    },
};

const directoryName: FormatDefinition<string> = {
    validate: str => {
        return !/[/\\]/.test(str);
    },
};

const directoryPath: FormatDefinition<string> = {
    validate: str => {
        if (str.startsWith("/") && str.endsWith("/")) {
            return path.normalize(str) === str;
        }

        return false;
    },
};

const userPassword: FormatDefinition<string> = {
    validate: str => {
        return str.length > 0;
    },
};

// https://github.com/ajv-validator/ajv-formats/blob/4dd65447575b35d0187c6b125383366969e6267e/src/formats.ts#L64
const emailRegex =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

const email: FormatDefinition<string> = {
    validate: emailStr => {
        return emailRegex.test(emailStr);
    },
};

export const ajvSelfPlugin = (ajv: Ajv): void => {
    ajv.addFormat("unix-timestamp", unixTimestamp);
    ajv.addFormat("uuid-v4", uuidV4);
    ajv.addFormat("file-suffix", fileSuffix);
    ajv.addFormat("avatar-suffix", avatarSuffix);
    ajv.addFormat("temp-photo-suffix", tempPhotoSuffix);
    ajv.addFormat("oauth-logo-suffix", oauthLogoSuffix);
    ajv.addFormat("url", url);
    ajv.addFormat("https", https);
    ajv.addFormat("phone", phone);
    ajv.addFormat("directory-name", directoryName);
    ajv.addFormat("directory-path", directoryPath);
    ajv.addFormat("user-password", userPassword);
    ajv.addFormat("email", email);
};

export const validateDirectoryName = (str: string): void => {
    const ajv = new Ajv();
    ajv.addFormat("directory-name", directoryName);

    const validate = ajv.compile({
        type: "string",
        format: "directory-name",
    });

    validate(str);
    if (validate.errors) {
        throw new Ajv.ValidationError(validate.errors);
    }
};
