import { AxiosResponse } from "axios";
import { ax } from "../../Axios";
import {
    AgoraCloudRecordAcquireRequestBody,
    AgoraCloudRecordAcquireResponse,
    AgoraCloudRecordParamsBaseType,
    AgoraCloudRecordParamsType,
    AgoraCloudRecordQueryResponse,
    AgoraCloudRecordStartedRequestBody,
    AgoraCloudRecordStartedResponse,
    AgoraCloudRecordStoppedRequestBody,
    AgoraCloudRecordStoppedResponse,
    AgoraCloudRecordUpdateLayoutRequestBody,
    AgoraCloudRecordUpdateLayoutResponse,
} from "./Types";
import { Agora } from "../../../../constants/Config";

const agoraCloudRecording = `https://api.agora.io/v1/apps/${Agora.appId}/cloud_recording`;
const authorization =
    "Basic" + Buffer.from(`${Agora.restfulId}:${Agora.restfulSecret}`).toString("base64");

const agoraCloudRecordingRequest = async <REQ, RESP>(path: string, data?: REQ): Promise<RESP> => {
    let response: AxiosResponse<RESP>;
    const headers = {
        Authorization: authorization,
        "Content-Type": "application/json",
    };

    if (data) {
        response = await ax.post(`${agoraCloudRecording}/${path}`, data, {
            headers,
        });
    } else {
        response = await ax.get(`${agoraCloudRecording}/${path}`, {
            headers,
        });
    }

    return response.data;
};

export const agoraCloudRecordAcquireRequest = async (
    data: AgoraCloudRecordAcquireRequestBody,
): Promise<AgoraCloudRecordAcquireResponse> => {
    return await agoraCloudRecordingRequest("acquire", data);
};

export const agoraCloudRecordStartedRequest = async (
    params: AgoraCloudRecordParamsBaseType,
    data: AgoraCloudRecordStartedRequestBody,
): Promise<AgoraCloudRecordStartedResponse> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/mode/${params.mode}/start`,
        data,
    );
};

export const agoraCloudRecordUpdateLayoutRequest = async (
    params: AgoraCloudRecordParamsType,
    data: AgoraCloudRecordUpdateLayoutRequestBody,
): Promise<AgoraCloudRecordUpdateLayoutResponse> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/sid/${params.sid}/mode/${params.mode}/updateLayout`,
        data,
    );
};

export const agoraCloudRecordQueryRequest = async (
    params: AgoraCloudRecordParamsType,
): Promise<AgoraCloudRecordQueryResponse<"string" | "json" | undefined>> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/sid/${params.sid}/mode/${params.mode}/query`,
    );
};

export const agoraCloudRecordStoppedRequest = async (
    params: AgoraCloudRecordParamsType,
    data: AgoraCloudRecordStoppedRequestBody,
): Promise<AgoraCloudRecordStoppedResponse> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/sid/${params.sid}/mode/${params.mode}/stop`,
        data,
    );
};
