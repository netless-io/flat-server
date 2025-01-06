import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ax } from "../../../utils/Axios";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { AI_SERVER_URL } from "./const";

@Controller<RequestType, any>({
    method: "post",
    path: "agora/ai/stop",
    auth: true,
})
export class AgoraAIStop extends AbstractController<RequestType, any> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["request_id", "channel_name"],
            properties: {
                request_id: {
                    type: "string",
                },
                channel_name: {
                    type: "string",
                },
            },
        },
    };

    public async execute(): Promise<Response<any>> {
        const { request_id, channel_name  } = this.body;

        const res = await ax.post<any>(`${AI_SERVER_URL}/start`, {
                request_id, 
                channel_name,
            }, 
            {    
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )
        return res;
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        request_id: string;
        channel_name: string;
    };
}
