import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { ServiceUser } from "../../../service/user/User";
import { Status } from "../../../../constants/Project";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { ServiceUserPhone } from "../../../service/user/UserPhone";
import { ServiceUserApple } from "../../../service/user/UserApple";
import { ServiceUserGithub } from "../../../service/user/UserGithub";
import { ServiceUserGoogle } from "../../../service/user/UserGoogle";
import { ServiceUserWeChat } from "../../../service/user/UserWeChat";
import { ServiceUserAgora } from "../../../service/user/UserAgora";
import { ServiceUserEmail } from "../../../service/user/UserEmail";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { alreadyJoinedRoomCount } from "./utils/AlreadyJoinedRoomCount";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { parseError } from "../../../../logger";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/deleteAccount",
    auth: true,
})
export class DeleteAccount extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {};

    public readonly svc = {
        user: new ServiceUser(this.userUUID),
        userAgora: new ServiceUserAgora(this.userUUID),
        userApple: new ServiceUserApple(this.userUUID),
        userGithub: new ServiceUserGithub(this.userUUID),
        userGoogle: new ServiceUserGoogle(this.userUUID),
        userPhone: new ServiceUserPhone(this.userUUID),
        userWeChat: new ServiceUserWeChat(this.userUUID),
        userEmail: new ServiceUserEmail(this.userUUID),
    };

    public async execute(): Promise<Response<ResponseType>> {
        if ((await alreadyJoinedRoomCount(this.userUUID)) !== 0) {
            throw new ControllerError(ErrorCode.UserRoomListNotEmpty);
        }

        await dataSource.transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                this.svc.user.physicalDeletion(t),
                this.svc.userAgora.physicalDeletion(t),
                this.svc.userApple.physicalDeletion(t),
                this.svc.userGithub.physicalDeletion(t),
                this.svc.userGoogle.physicalDeletion(t),
                this.svc.userPhone.physicalDeletion(t),
                this.svc.userWeChat.physicalDeletion(t),
                this.svc.userEmail.physicalDeletion(t),
            );

            await Promise.all(commands);
        });

        await RedisService.set(RedisKey.userDelete(this.userUUID), "").catch(error => {
            this.logger.warn("set userDelete failed", parseError(error));
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {}

interface ResponseType {}
