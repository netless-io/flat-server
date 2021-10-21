import { ControllerClass } from "../../../abstract/controller";
import { AlibabaCloudRemoveFile } from "./alibabaCloud/remove";
import { AlibabaCloudRename } from "./alibabaCloud/rename";
import { AlibabaCloudUploadStart } from "./alibabaCloud/upload/Start";
import { AlibabaCloudUploadFinish } from "./alibabaCloud/upload/Finish";
import { UploadCancel } from "./upload/cancel";
import { FileConvertFinish } from "./convert/Finish";
import { FileConvertStart } from "./convert/Start";
import { CloudStorageList } from "./list";
import { URLCloudAdd } from "./urlCloud/add";
import { URLCloudRemove } from "./urlCloud/remove";
import { URLCloudRename } from "./urlCloud/rename";

export const cloudStorageRouters: Readonly<Array<ControllerClass<any, any>>> = Object.freeze([
    AlibabaCloudRemoveFile,
    AlibabaCloudRename,
    AlibabaCloudUploadStart,
    AlibabaCloudUploadFinish,
    UploadCancel,
    FileConvertFinish,
    FileConvertStart,
    CloudStorageList,
    URLCloudAdd,
    URLCloudRemove,
    URLCloudRename,
]);
