export type DeveloperOAuthSecretCreateReturn = {
    secretUUID: string;
    clientSecret: string;
};

export type DeveloperOAuthSecretInfoReturn = Array<{
    secretUUID: string;
    clientSecret: string;
    createdAt: number;
}>;
