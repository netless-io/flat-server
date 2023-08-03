import { createHash } from "crypto";
import { Salt } from "../constants/Config";

export function hash(data: string): string {
    return createHash("md5").update(data).update(Salt).digest("hex");
}
