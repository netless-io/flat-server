import { AxiosResponse } from "axios";
import { ax } from "./Axios";

export const wechatRequest = async <T>(url: string): Promise<T> => {
    const response: AxiosResponse<T | WeChatRequestFailed> = await ax.get(url);

    if ("errmsg" in response.data) {
        throw new Error(response.data.errmsg);
    }

    return response.data;
};

interface WeChatRequestFailed {
    readonly errcode: number;
    readonly errmsg: string;
}
