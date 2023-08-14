import { defaultAvatar } from "../constants/Config";

const AvatarsCount = 18;

/** Generate Avatar base on uid */
export function generateAvatar(uid: string): string {
    let index = 0;
    if (uid) {
        for (let i = uid.length - 1; i >= 0; i--) {
            index += uid.charCodeAt(i);
        }
        index = index % AvatarsCount;
    } else {
        index = Math.floor(Math.random() * AvatarsCount);
    }
    return defaultAvatar(index);
}
