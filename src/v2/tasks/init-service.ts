import { registerService } from "../service-locator";
import { Censorship, StorageService } from "../../constants/Config";
import { AliOSSService } from "../services/oss/ali-oss";
import { AliComplianceTextService } from "../services/compliance-text/ali-compliance-text";
import { AliComplianceImageService } from "../services/compliance-image/ali-compliance-image";

export const initService = (): void => {
    registerService("oss", (ids?: IDS) => {
        if (!ids) {
            throw new Error("oss service need ids");
        }
        switch (StorageService.type) {
            case "oss": {
                return new AliOSSService(ids);
            }
            default: {
                throw new Error("Unsupported storage service");
            }
        }
    });

    registerService("complianceText", (ids?: IDS) => {
        if (!ids) {
            throw new Error("complianceText service need ids");
        }
        switch (Censorship.text.type) {
            case "aliCloud": {
                return new AliComplianceTextService(ids);
            }
            default: {
                throw new Error("Unsupported storage service");
            }
        }
    });

    registerService("complianceImage", (ids?: IDS) => {
        if (!ids) {
            throw new Error("complianceImage service need ids");
        }
        switch (Censorship.video.type) {
            case "aliCloud": {
                return new AliComplianceImageService(ids);
            }
            default: {
                throw new Error("Unsupported storage service");
            }
        }
    });
};
