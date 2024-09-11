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
            required: ["isAgree"],
            properties: {
                isAgree: {
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
        await this.svc.userAgreement.set(this.body.isAgree);
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
        isAgree: boolean;
    };
}

interface ResponseType {
    userUUID: string;
}
