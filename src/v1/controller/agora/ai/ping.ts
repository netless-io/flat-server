import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ax } from "../../../utils/Axios";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { AI_SERVER_URL_CN, AI_SERVER_URL_EN, AI_SERVER_URL_CN_NEW, AI_SERVER_URL_EN_NEW } from "./const";
import { Status } from "../../../../constants/Project";

@Controller<RequestType, any>({
    method: "post",
    path: "agora/ai/ping",
    auth: true,
})
export class AgoraAIPing extends AbstractController<RequestType, any> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["request_id", "channel_name", "language"],
            properties: {
                request_id: {
                    type: "string",
                },
                channel_name: {
                    type: "string",
                },
                language: {
                    type: "string",
                },
                is_new: {
                    type: "boolean",
                    nullable: true,
                },
            },
        },
    };

    public async execute(): Promise<Response<any>> {
        const { request_id, channel_name, language, is_new } = this.body;
        const api = language === "zh" ? 
            is_new ? AI_SERVER_URL_CN_NEW : AI_SERVER_URL_CN : 
            is_new ? AI_SERVER_URL_EN_NEW : AI_SERVER_URL_EN ;
        const res = await ax.post<any>(`${api}/ping`, {
                request_id, 
                channel_name,
            }, 
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
        language: string;
        is_new?: boolean;
    };
}
