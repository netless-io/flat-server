import os from "os";
import path from "path";
import { format } from "date-fns/fp";
import { EnvVariableParse } from "./EnvVariableParse";

export const variables = {
    HOSTNAME: os.hostname(),
    // __dirname: dist/
    PROJECT_DIR: path.resolve(__dirname, ".."),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DAY_DATE: (): string => format("yyyy-MM-dd")(Date.now()),
};

export const envVariable = new EnvVariableParse(variables);
