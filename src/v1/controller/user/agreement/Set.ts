import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Status } from "../../../../constants/Project";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";

import { ServiceUserAgreement } from "../../../service/user/UserAgreement";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/agreement/set",
    auth: true,
})
export class AgreementSet extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["is_agree_collect_data"],
            properties: {
                is_agree_collect_data: {
                    type: "boolean"
                },
            },
        },
    };

    public readonly svc: {
        userAgreement: ServiceUserAgreement;
    };

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            userAgreement: new ServiceUserAgreement(this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        await this.svc.userAgreement.set(this.body.is_agree_collect_data);
        return {
            status: Status.Success,
            data: {
                userUUID: this.userUUID
            }
        };
    }
    
    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        is_agree_collect_data: boolean;
    };
}

interface ResponseType {
    userUUID: string;
}
