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
import {
    ClassroomResourceProfile,
    getDefaultClassroomResourceProfile,
} from "../../../../classroomResource/Registry";

const agoraCloudRecordingRequest = async <REQ, RESP>(
    path: string,
    data?: REQ,
    profile: ClassroomResourceProfile = getDefaultClassroomResourceProfile(),
): Promise<RESP> => {
    let response: AxiosResponse<RESP>;
    const agoraCloudRecording = `https://api.agora.io/v1/apps/${profile.agora.appId}/cloud_recording`;
    const authorization =
        "Basic " +
        Buffer.from(`${profile.agora.restfulId}:${profile.agora.restfulSecret}`).toString("base64");
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
    profile?: ClassroomResourceProfile,
): Promise<AgoraCloudRecordAcquireResponse> => {
    return await agoraCloudRecordingRequest("acquire", data, profile);
};

export const agoraCloudRecordStartedRequest = async (
    params: AgoraCloudRecordParamsBaseType,
    data: AgoraCloudRecordStartedRequestBody,
    profile?: ClassroomResourceProfile,
): Promise<AgoraCloudRecordStartedResponse> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/mode/${params.mode}/start`,
        data,
        profile,
    );
};

export const agoraCloudRecordUpdateLayoutRequest = async (
    params: AgoraCloudRecordParamsType,
    data: AgoraCloudRecordUpdateLayoutRequestBody,
    profile?: ClassroomResourceProfile,
): Promise<AgoraCloudRecordUpdateLayoutResponse> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/sid/${params.sid}/mode/${params.mode}/updateLayout`,
        data,
        profile,
    );
};

export const agoraCloudRecordQueryRequest = async (
    params: AgoraCloudRecordParamsType,
    profile?: ClassroomResourceProfile,
): Promise<AgoraCloudRecordQueryResponse<"string" | "json" | undefined>> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/sid/${params.sid}/mode/${params.mode}/query`,
        undefined,
        profile,
    );
};

export const agoraCloudRecordStoppedRequest = async (
    params: AgoraCloudRecordParamsType,
    data: AgoraCloudRecordStoppedRequestBody,
    profile?: ClassroomResourceProfile,
): Promise<AgoraCloudRecordStoppedResponse> => {
    return await agoraCloudRecordingRequest(
        `resourceid/${params.resourceid}/sid/${params.sid}/mode/${params.mode}/stop`,
        data,
        profile,
    );
};
