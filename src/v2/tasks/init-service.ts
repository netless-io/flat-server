import { registerService } from "../service-locator";
import { StorageService } from "../../constants/Config";
import { AliOSSService } from "../services/oss/ali-oss";

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
};
