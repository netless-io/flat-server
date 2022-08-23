export abstract class OSSAbstract {
    public abstract remove(fileList: string | string[]): Promise<void>;
    public abstract rename(filePath: string, newFileName: string): Promise<void>;
    public abstract exists(filePath: string): Promise<boolean>;
}
