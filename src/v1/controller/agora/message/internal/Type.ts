// See: https://docs-preprod.agora.io/en/Agora%20Platform/ncs#notification-callback-format
export interface MessageNotificationPublicField<P> {
    noticeId: string;
    productId: number;
    eventType: number;
    notifyMs: number;
    payload: P;
}

// See: https://docs.agora.io/en/cloud-recording/cloud_recording_callback_rest?platform=All%20Platforms#callback-information
export interface CloudRecording<D> {
    cname: string;
    uid: string;
    sid: string;
    sequence: number;
    sendts: number;
    serviceType: number;
    details: D;
}

// See: https://docs.agora.io/en/cloud-recording/cloud_recording_callback_rest?platform=All%20Platforms#45-recorder_snapshot_file
export interface IRecorderSnapshotFile {
    msgName: string;
    fileName: string;
}
