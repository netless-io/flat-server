import { rtcScreenshotQueue } from "./RTCScreenshot";
import { rtcVoiceQueue } from "./RTCVoice";

export const rtcQueue = (roomUUID: string, delay?: number) => {
    rtcScreenshotQueue.add(roomUUID, delay);

    rtcVoiceQueue.add(roomUUID, delay);
};
