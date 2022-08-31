export abstract class ComplianceImageAbstract {
    public abstract imageNormal(imageURL: string): Promise<boolean>;
    public abstract assertImageNormal(imageURL: string): Promise<void>;
}
