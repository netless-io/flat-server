import jwt, { Algorithm } from "fast-jwt";
import { JWT, Server } from "../../../../constants/Config";
import { LoginPlatform } from "../../../../constants/Project";
import { v4 } from "uuid";

export class HelperJWT {
    private static readonly signer = jwt.createSigner({
        algorithm: JWT.algorithms as Algorithm,
        iss: Server.name,
        key: JWT.secret,
        expiresIn: 1000 * 60 * 3,
    });

    public static full(userUUID: string, loginSource: LoginPlatform): string {
        return HelperJWT.signer({
            userUUID,
            loginSource,
        });
    }

    public static quick(): string {
        return HelperJWT.full(v4(), LoginPlatform.Github);
    }

    public static fixedUserUUID(userUUID: string): string {
        return HelperJWT.full(userUUID, LoginPlatform.Github);
    }
}
