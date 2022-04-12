import { isValid } from "date-fns/fp";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import Ajv, { FormatDefinition } from "ajv";
import path from "path";
import { CloudStorage } from "../constants/Config";
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
        const suffix = path.extname(fileName).substr(1);

        return CloudStorage.allowFileSuffix.includes(suffix);
    },
};

const urlFileSuffix: FormatDefinition<string> = {
    validate: fileName => {
        const suffix = path.extname(fileName).substr(1);

        return CloudStorage.allowUrlFileSuffix.includes(suffix);
    },
};

// link: https://github.com/ajv-validator/ajv-formats/blob/c1cb46cad79f984020a9a0ef569e9c091ce24400/src/formats.ts#L59
const urlRegex = /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;

const url: FormatDefinition<string> = {
    validate: urlStr => {
        return urlRegex.test(urlStr);
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

export const ajvSelfPlugin = (ajv: Ajv): void => {
    ajv.addFormat("unix-timestamp", unixTimestamp);
    ajv.addFormat("uuid-v4", uuidV4);
    ajv.addFormat("file-suffix", fileSuffix);
    ajv.addFormat("url-file-suffix", urlFileSuffix);
    ajv.addFormat("url", url);
    ajv.addFormat("phone", phone);
};
