import test from "ava";
import { filePayloadParse } from "../file-payload-parse";
import { FileConvertStep, FileResourceType } from "../../../../../../model/cloudStorage/Constants";
import { Region } from "../../../../../../constants/Project";
import { v4 } from "uuid";

const namespace = "services.cloud-storage.utils.file-payload-parse";

test(`${namespace} - should return empty object`, ava => {
    const payload = {
        region: Region.CN_HZ,
    };
    {
        const r = filePayloadParse(FileResourceType.Directory, payload);
        ava.deepEqual(r, {});
    }

    {
        const r = filePayloadParse(FileResourceType.NormalResources, payload);
        ava.deepEqual(r, {});
    }
});

test(`${namespace} - should return whiteboardConvertPayload`, ava => {
    const payload = {
        region: Region.CN_HZ,
        convertStep: FileConvertStep.Converting,
        taskToken: v4(),
        taskUUID: v4(),
    };
    const r = filePayloadParse(FileResourceType.WhiteboardConvert, payload);

    ava.deepEqual(r, {
        whiteboardConvert: payload,
    });
});

test(`${namespace} - should return whiteboardProjectorPayload`, ava => {
    const payload = {
        region: Region.SG,
        convertStep: FileConvertStep.Converting,
        taskToken: v4(),
        taskUUID: v4(),
    };
    const r = filePayloadParse(FileResourceType.WhiteboardProjector, payload);

    ava.deepEqual(r, {
        whiteboardProjector: payload,
    });
});
