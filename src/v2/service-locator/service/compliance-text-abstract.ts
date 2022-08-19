export abstract class ComplianceTextAbstract {
    public abstract textNormal(text: string): Promise<boolean>;
}
