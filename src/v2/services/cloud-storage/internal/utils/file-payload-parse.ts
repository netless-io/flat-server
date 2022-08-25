import { FileResourceType } from "../../../../../model/cloudStorage/Constants";
import {
    FilePayload,
    WhiteboardConvertPayload,
    WhiteboardProjectorPayload,
} from "../../../../../model/cloudStorage/Types";

export const filePayloadParse = (
    resourceType: FileResourceType,
    payload: FilePayload,
): FilePayloadParse => {
    switch (resourceType) {
        case FileResourceType.Directory:
        case FileResourceType.NormalResources: {
            return {};
        }
        case FileResourceType.WhiteboardConvert: {
            const p = payload as WhiteboardConvertPayload;

            return {
                whiteboardConvert: {
                    taskUUID: p.taskUUID,
                    taskToken: p.taskToken,
                    convertStep: p.convertStep,
                    region: p.region,
                },
            };
        }
        case FileResourceType.WhiteboardProjector: {
            const p = payload as WhiteboardProjectorPayload;

            return {
                whiteboardProjector: {
                    taskUUID: p.taskUUID,
                    taskToken: p.taskToken,
                    convertStep: p.convertStep,
                    region: p.region,
                },
            };
        }
    }
};

export type FilePayloadParse =
    // eslint-disable-next-line @typescript-eslint/ban-types
    | {}
    | {
          whiteboardConvert: WhiteboardConvertPayload;
      }
    | {
          whiteboardProjector: WhiteboardProjectorPayload;
      };
