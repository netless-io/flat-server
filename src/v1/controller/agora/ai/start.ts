import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ax } from "../../../utils/Axios";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { AI_SERVER_URL_CN, AI_SERVER_URL_EN, AI_SERVER_URL_CN_NEW, AI_SERVER_URL_EN_NEW, AI_TEACHER_ID } from "./const";
import { Status } from "../../../../constants/Project";
import { Agora } from "../../../../constants/Config";
import { getRTCToken } from "../../../../v1/utils/AgoraToken";
@Controller<RequestType, any>({
    method: "post",
    path: "agora/ai/start",
    auth: true,
})
export class AgoraAIStart extends AbstractController<RequestType, any> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["request_id", "channel_name", "user_uid", "language", "role"],
            properties: {
                request_id: {
                    type: "string",
                },
                channel_name: {
                    type: "string",
                },
                user_uid: {
                    type: "number",
                },
                language: {
                    type: "string",
                },
                role: {
                    type: "string",
                },
                is_new: {
                    type: "boolean",
                    nullable: true,
                },
                bot_id: {
                    type: "number",
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<Response<any>> {
        const { request_id, channel_name, user_uid, language, role, is_new, bot_id  } = this.body;
        const api = language === "zh" ? 
            is_new ? AI_SERVER_URL_CN_NEW : AI_SERVER_URL_CN : 
            is_new ? AI_SERVER_URL_EN_NEW : AI_SERVER_URL_EN ;
        const params = {
            request_id, 
            channel_name,
            user_uid,
            timbre_type: role,
        } as any;
        if (is_new) {
            const teacher_id = bot_id || AI_TEACHER_ID;
            const token = await getRTCToken(channel_name, teacher_id);
            params["token"] = token;
            params["app_id"] = Agora.appId;
            params["bot_id"] = teacher_id;
        }
        const res = await ax.post<any>(`${api}/start`, params, 
            {    
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )
        
        return {
            status: Status.Success,
            data: res.data,
        }
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        request_id: string;
        channel_name: string;
        user_uid: number;
        language: string;
        role: string;
        is_new?: boolean;
        bot_id?: number;
    };
}
