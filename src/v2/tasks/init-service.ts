import { registerService } from "../service-locator";
import { Censorship, StorageService } from "../../constants/Config";
import { AliOSSService } from "../services/oss/ali-oss";
import { AliComplianceTextService } from "../services/compliance-text/ali-compliance-text";

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
};
