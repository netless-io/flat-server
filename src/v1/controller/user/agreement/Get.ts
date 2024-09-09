import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Status } from "../../../../constants/Project";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";

import { ServiceUserAgreement } from "../../../service/user/UserAgreement";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/agreement/get",
    auth: true,
})
export class AgreementGet extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {};

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
        const isAgree = await this.svc.userAgreement.isAgreeCollectData();
        return {
            status: Status.Success,
            data: {
                isAgree
            }
        } 
    }
    
    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {}

interface ResponseType {
    isAgree: boolean;
}
