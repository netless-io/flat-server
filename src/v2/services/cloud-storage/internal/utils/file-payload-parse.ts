import { FileResourceType } from "../../../../../model/cloudStorage/Constants";
import {
    FilePayload,
    LocalCoursewarePayload,
    WhiteboardConvertPayload,
    WhiteboardProjectorPayload,
} from "../../../../../model/cloudStorage/Types";

export const filePayloadParse = (
    resourceType: FileResourceType,
    payload: FilePayload,
): FilePayloadParse => {
    switch (resourceType) {
        case FileResourceType.Directory:
        case FileResourceType.NormalResources:
        case FileResourceType.OnlineCourseware: {
            return {};
        }
        case FileResourceType.WhiteboardConvert: {
            const p = payload as WhiteboardConvertPayload;

            return {
                whiteboardConvertPayload: {
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
                whiteboardProjectorPayload: {
                    taskUUID: p.taskUUID,
                    taskToken: p.taskToken,
                    convertStep: p.convertStep,
                    region: p.region,
                },
            };
        }
        case FileResourceType.LocalCourseware: {
            const p = payload as LocalCoursewarePayload;

            return {
                localCoursewarePayload: {
                    convertStep: p.convertStep,
                },
            };
        }
    }
};

export type FilePayloadParse =
    // eslint-disable-next-line @typescript-eslint/ban-types
    | {}
    | {
          whiteboardConvertPayload: WhiteboardConvertPayload;
      }
    | {
          whiteboardProjectorPayload: WhiteboardProjectorPayload;
      }
    | {
          localCoursewarePayload: LocalCoursewarePayload;
      };
