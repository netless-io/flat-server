import { OSSAbstract } from "../../service-locator/service/oss-abstract";

export class AliOSS extends OSSAbstract {
    public constructor() {
        super();
    }

    public async remove(): Promise<void> {
        await Promise.resolve();
        throw new Error("Method not implemented.");
    }
}
