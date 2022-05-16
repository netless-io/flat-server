/**
 * {@link https://docs.agora.io/en/cloud-recording/restfulapi/ type-en-docs}
 * {@link https://docs.agora.io/cn/cloud-recording/restfulapi/ type-cn-docs}
 */

export interface AgoraCloudRecordParamsBaseType {
    resourceid: string;
    mode: "individual" | "mix" | "web";
}

export interface AgoraCloudRecordParamsType extends AgoraCloudRecordParamsBaseType {
    sid: string;
}

export interface AgoraCloudRecordAcquireRequestBody {
    cname: string;
    uid: string;
    clientRequest: {
        resourceExpiredHour?: number;
        scene?: number;
    };
}

export interface AgoraCloudRecordAcquireResponse {
    resourceId: string;
}

export interface AgoraCloudRecordStartedRequestBody {
    cname: string;
    uid: string;
    clientRequest: {
        token: string;
        recordingConfig?: {
            channelType?: number;
            streamTypes?: number;
            decryptionMode?: number;
            secret?: string;
            audioProfile?: number;
            videoStreamType?: number;
            maxIdleTime?: number;
            transcodingConfig?: {
                width: number;
                height: number;
                fps: number;
                bitrate: number;
                maxResolutionUid?: string;
                mixedVideoLayout?: number;
                backgroundColor?: string;
                layoutConfig?: Array<{
                    uid?: string;
                    x_axis?: number;
                    y_axis?: number;
                    width?: number;
                    height?: number;
                    alpha?: number;
                    render_mode?: number;
                }>;
            };
            subscribeVideoUids?: Array<string>;
            unSubscribeVideoUids?: Array<string>;
            subscribeAudioUids?: Array<string>;
            unSubscribeAudioUids?: Array<string>;
            subscribeUidGroup?: number;
        };
        recordingFileConfig?: {
            avFileType?: Array<string>;
        };
        snapshotConfig?: {
            fileType: Array<string>;
            captureInterval?: number;
        };
        storageConfig?: {
            vendor: number;
            region: number;
            bucket: string;
            accessKey: string;
            secretKey: string;
            fileNamePrefix?: Array<string>;
        };
        extensionServiceConfig?: {
            extensionServices: Array<{
                serviceName?: string;
                errorHandlePolicy?: string;
                streamTypes?: number;
                serviceParam?: {
                    serviceParam?: string;
                    secretKey?: string;
                    regionId?: string;
                    callbackAddr?: string;
                    apiData: {
                        videoData?: {
                            title: string;
                            description?: string;
                            coverUrl?: string;
                            cateId?: string;
                            tags?: string;
                            templateGroupId?: string;
                            userData?: string;
                            storageLocation?: string;
                            workflowI?: string;
                        };
                        accessKey?: string;
                        secretKey?: string;
                        callbackSeed?: string;
                    };
                };
            }>;
            apiVersion?: string;
            errorHandlePolicy?: string;
        };
    };
}

export interface AgoraCloudRecordStartedResponse {
    sid: string;
    resourceId: string;
}

export interface AgoraCloudRecordUpdateLayoutRequestBody {
    cname: string;
    uid: string;
    clientRequest?: {
        maxResolutionUid?: string;
        mixedVideoLayout?: number;
        backgroundColor?: string;
        layoutConfig?: Array<{
            uid?: string;
            x_axis: number;
            y_axis: number;
            width: number;
            height: number;
            alpha?: number;
            render_mode?: number;
        }>;
    };
}

export interface AgoraCloudRecordUpdateLayoutResponse {
    sid: string;
    resourceId: string;
}

export interface AgoraCloudRecordQueryResponse<T extends "string" | "json" | undefined> {
    sid: string;
    resourceId: string;
    serverResponse: {
        fileListMode?: T;
        fileList?: T extends "string"
            ? string
            : T extends undefined
            ? undefined
            : Array<{
                  filename: string;
                  trackType: "audio" | "video" | "audio_and_video";
                  uid: string;
                  mixedAllUser: boolean;
                  isPlayable: boolean;
                  sliceStartTime: number;
              }>;
        status: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 20;
        sliceStartTime: string;
        extensionServiceState: Array<{
            serviceName: "aliyun_vod_service" | "web_recorder_service";
            payload: {
                state: "inProgress" | "idle";
                videoInfo:
                    | Array<{
                          fileName: string;
                          videoId: string;
                      }>
                    | Array<{
                          state: "inProgress" | "idle" | "exit";
                          fileList: Array<{
                              fileName: string;
                              sliceStartTime: string;
                          }>;
                      }>;
            };
        }>;
        subServiceStatus: {
            recordingService:
                | "serviceIdle"
                | "serviceStarted"
                | "serviceReady"
                | "serviceInProgress"
                | "serviceCompleted"
                | "servicePartialCompleted"
                | "serviceValidationFailed"
                | "serviceAbnormal";
        };
    };
}

export interface AgoraCloudRecordStoppedRequestBody {
    cname: string;
    uid: string;
    clientRequest: {
        async_stop?: boolean;
    };
}

export interface AgoraCloudRecordStoppedResponse {
    sid: string;
    resourceId: string;
    serverResponse: {
        fileListMode?: "json";
        fileList?: Array<{
            filename: string;
            trackType: "audio" | "video" | "audio_and_video";
            uid: string;
            mixedAllUser: boolean;
            isPlayable: boolean;
            sliceStartTime: number;
        }>;
        uploadingStatus: "uploaded" | "backuped" | "unknown";
        extensionServiceState?: {
            serviceName?: string;
            payload:
                | {
                      uploadingStatus: string;
                  }
                | {
                      state: string;
                      fileList: {
                          fileName: string;
                          sliceStartTime: string;
                      };
                  };
        };
    };
}
