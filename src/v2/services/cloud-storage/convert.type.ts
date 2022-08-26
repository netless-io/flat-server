import {
    WhiteboardConvertPayload,
    WhiteboardProjectorPayload,
} from "../../../model/cloudStorage/Types";
import { FileResourceType } from "../../../model/cloudStorage/Constants";

export type CloudStorageConvertFileInfo = {
    fileURL: string;
} & (
    | {
          fileResourceType: FileResourceType.WhiteboardConvert;
          payload: WhiteboardConvertPayload;
      }
    | {
          fileResourceType: FileResourceType.WhiteboardProjector;
          payload: WhiteboardProjectorPayload;
      }
);

export type WhiteboardConvertInfo = {
    resourceType: FileResourceType.WhiteboardConvert;
    whiteboardConvert: {
        taskUUID: string;
        taskToken: string;
    };
};

export type WhiteboardProjectorInfo = {
    resourceType: FileResourceType.WhiteboardProjector;
    whiteboardProjector: {
        taskUUID: string;
        taskToken: string;
    };
};

export type CloudStorageConvertStart = WhiteboardConvertInfo | WhiteboardProjectorInfo;
