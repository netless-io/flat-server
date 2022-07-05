import { rtcScreenshotQueue } from "./RTCScreenshot";
import { rtcVoiceQueue } from "./RTCVoice";

export const rtcQueue = (roomUUID: string, delay?: number): void => {
    rtcScreenshotQueue.add(roomUUID, delay);

    rtcVoiceQueue.add(roomUUID, delay);
};
