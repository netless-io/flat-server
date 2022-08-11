import { registerService } from "../service-locator";
import { StorageService } from "../../constants/Config";
import { AliOSS } from "../services/oss/ali-oss";

export const initService = (): void => {
    registerService("oss", () => {
        switch (StorageService.type) {
            case "oss": {
                return new AliOSS();
            }
            default: {
                throw new Error("Unsupported storage service");
            }
        }
    });
};
