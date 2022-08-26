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
            return {
                whiteboardConvert: payload as WhiteboardConvertPayload,
            };
        }
        case FileResourceType.WhiteboardProjector: {
            return {
                whiteboardProjector: payload as WhiteboardProjectorPayload,
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
