import path from "path";
import { CloudStorage } from "../../../../constants/Config";

export const getFilePath = (fileName: string, userUUID: string, fileUUID: string): string => {
    // e.g: PREFIX/UUID.png
    return `${CloudStorage.prefixPath}/avatar/${userUUID}/${fileUUID}${path.extname(fileName)}`;
};
