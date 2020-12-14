export type UserField = {
    id: string;
    name: string;
    avatar_url: string;
    phone: string;
    sex: 0 | 1 | 2;
    user_id: string;
    last_login_platform: string;
};

export type WeChatUserField = {
    id: number;
    user_id: string;
    open_id: string;
    union_id: string;
};
