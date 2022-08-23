export abstract class ComplianceTextAbstract {
    public abstract textNormal(text: string): Promise<boolean>;
    public abstract assertTextNormal(text: string): Promise<void>;
}
