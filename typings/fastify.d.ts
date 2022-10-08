import { DeveloperOAuthScope } from "../src/model/oauth/oauth-infos";

declare module "fastify" {
    interface FastifyRequest {
        oauth2: {
            userUUID: string;
            scope: DeveloperOAuthScope[];
            oauthUUID: string;
        };
    }
}
