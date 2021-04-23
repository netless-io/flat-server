import { ax } from "../../Axios";
import { Github } from "../../../../Constants";

export const getGithubAccessToken = async (code: string, authUUID: string): Promise<string> => {
    const response = await ax.post<AccessToken | RequestFailed>(
        `https://github.com/login/oauth/access_token?client_id=${Github.CLIENT_ID}&client_secret=${Github.CLIENT_SECRET}&code=${code}&state=${authUUID}`,
        null,
        {
            headers: {
                accept: "application/json",
            },
        },
    );

    if ("error" in response.data) {
        throw new Error(response.data.error);
    }

    return response.data.access_token;
};

export const getGithubUserInfo = async (token: string): Promise<GithubUserInfo> => {
    const response = await ax.get<GithubUserInfo | RequestFailed>("https://api.github.com/user", {
        headers: {
            accept: "application/json",
            Authorization: `token ${token}`,
        },
    });

    if ("error" in response.data) {
        throw new Error(response.data.error);
    }

    return response.data;
};

interface AccessToken {
    access_token: string;
}

interface GithubUserInfo {
    id: number;
    avatar_url: string;
    login: string;
}

interface RequestFailed {
    error: string;
    error_description: string;
}
