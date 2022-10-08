import { FastifyInstance } from "fastify/types/instance";
import jwt from "@fastify/jwt";
import { JWT, Server } from "../../constants/Config";
import { Algorithm } from "fast-jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { loggerServer, parseError } from "../../logger";
import { Status } from "../../constants/Project";
import { ErrorCode } from "../../ErrorCode";
import RedisService from "../../thirdPartyService/RedisService";
import { RedisKey } from "../../utils/Redis";
import fp from "fastify-plugin";

const plugin = async (instance: FastifyInstance, _opts: any): Promise<void> => {
    await instance.register(jwt, {
        secret: JWT.secret,
        sign: {
            algorithm: JWT.algorithms as Algorithm,
            iss: Server.name,
            expiresIn: "29 days",
        },
    });

    instance.decorateRequest("oauth2", null);

    instance.decorate(
        "authenticate",
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const parts = request?.headers?.authorization?.split(" ");
            if (!parts || parts.length < 1) {
                loggerServer.warn("jwt format verify");
                // TODO: use @fastify/errors
                void reply.send({
                    status: Status.Failed,
                    code: ErrorCode.JWTSignFailed,
                });

                return;
            }

            const scheme = parts[0];
            const credentials = parts[1];

            if (scheme === "OAuth2") {
                const [userUUID, scope, oauthUUID] = await RedisService.hmget(
                    RedisKey.oauthAccessToken(credentials),
                    ["userUUID", "scope", "oauthUUID"],
                );

                if (!userUUID || !scope || !oauthUUID) {
                    loggerServer.warn("oauth access token invalid");
                    void reply.send({
                        status: Status.Failed,
                        code: ErrorCode.OAUTH2AccessTokenInvalid,
                    });
                    return;
                }

                instance.decorateRequest("oauth2", {
                    userUUID,
                    scope,
                    oauthUUID,
                });

                return;
            }

            try {
                await request.jwtVerify();
            } catch (err) {
                loggerServer.warn("jwt verify failed", parseError(err));
                void reply.send({
                    status: Status.Failed,
                    code: ErrorCode.JWTSignFailed,
                });

                return;
            }
        },
    );
};

export const fastifyAuthenticate = fp(plugin);
