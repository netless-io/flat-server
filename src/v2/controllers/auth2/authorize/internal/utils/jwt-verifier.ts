import jwt, { Algorithm } from "fast-jwt";
import { JWT } from "../../../../../../constants/Config";
import { FError } from "../../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../../ErrorCode";

const verifyJWT = jwt.createVerifier({
    // eslint-disable-next-line @typescript-eslint/require-await
    key: async () => JWT.secret,
    algorithms: [JWT.algorithms as Algorithm],
});

export const getUserUUIDInJWT = async (token: string | undefined): Promise<string> => {
    if (!token) {
        throw new FError(ErrorCode.NeedLoginAgain);
    }

    const { userUUID } = await verifyJWT(token);

    if (!userUUID) {
        throw new FError(ErrorCode.NeedLoginAgain);
    }

    return userUUID as string;
};
