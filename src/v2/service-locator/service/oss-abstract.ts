export abstract class OSSAbstract {
    public abstract remove(fileList: string | string[]): Promise<void>;
}
