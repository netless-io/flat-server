import { RecorderSnapshotFile } from "./RecorderSnapshotFile";
import { CloudRecording, IRecorderSnapshotFile } from "./Type";

export class Events {
    private readonly hitFlag: `${number}:${number}`;

    public constructor(private readonly productId: number, private readonly eventType: number) {
        this.hitFlag = `${this.productId}:${this.eventType}` as const;
    }

    public async handler(payload: CloudRecording<IRecorderSnapshotFile>): Promise<void> {
        switch (this.hitFlag) {
            case RecorderSnapshotFile.hitFlag: {
                return await new RecorderSnapshotFile(payload).execute();
            }
            default: {
                return Promise.resolve();
            }
        }
    }

    public get secret(): string | null {
        switch (this.hitFlag) {
            case RecorderSnapshotFile.hitFlag: {
                return RecorderSnapshotFile.secret;
            }
            default: {
                return null;
            }
        }
    }

    public get enable(): boolean {
        switch (this.hitFlag) {
            case RecorderSnapshotFile.hitFlag: {
                return RecorderSnapshotFile.enable;
            }
            default: {
                return false;
            }
        }
    }
}
