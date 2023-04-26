import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ServiceUser } from "../../../service/user/User";
import { Status } from "../../../../constants/Project";
import { aliGreenText } from "../../../utils/AliGreen";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { ServiceUserSensitive } from "../../../service/user/UserSensitive";

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
        userSensitive: ServiceUserSensitive;
    };

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userSensitive: new ServiceUserSensitive(this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        if (await aliGreenText.textNonCompliant(this.body.name)) {
            throw new ControllerError(ErrorCode.NonCompliant);
        }

        await this.svc.user.updateName(this.body.name);
        await this.svc.userSensitive.name({ name: this.body.name });

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
