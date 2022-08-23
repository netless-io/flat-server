export abstract class OSSAbstract {
    public abstract remove(fileList: string | string[]): Promise<void>;
    public abstract rename(filePath: string, newFileName: string): Promise<void>;
    public abstract exists(filePath: string): Promise<boolean>;
    public abstract policyTemplate(
        fileName: string,
        filePath: string,
        fileSize: number,
        expiration?: number,
    ): {
        policy: string;
        signature: string;
    };
}
