import { Agora } from "../../../../Constants";

const agoraAPIServerURL = "https://api.agora.io";
const agoraV1API = `${agoraAPIServerURL}/v1`;
const v1APP = `${agoraV1API}/apps/${Agora.APP_ID}`;

export const agoraCloudRecording = `${v1APP}/cloud_recording`;
