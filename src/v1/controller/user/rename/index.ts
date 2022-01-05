import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ServiceUser } from "../../../service/user/User";
import { Status } from "../../../../constants/Project";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/rename",
    auth: true,
})
export class Rename extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["name"],
            properties: {
                name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 50,
                },
            },
        },
    };

    public readonly svc: {
        user: ServiceUser;
    };

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        await this.svc.user.updateName(this.body.name);

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        name: string;
    };
}

interface ResponseType {}
