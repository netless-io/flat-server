import { Method } from "axios";

export type LoggerError = {
    errorString: string;
    errorMessage: string;
    errorStack: string;
    errorAxios?: {
        status?: number;
        statusText?: string;
        url?: string;
        method?: Method;
        data?: string;
        headers?: string;
    };
    errorQuery?: {
        code?: string;
        sqlMessage?: string;
        message?: string;
        sqlState?: string;
        query?: string;
    };
};

export type LoggerBase = LoggerError & {
    hostname: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type LoggerServer = LoggerBase & {};

export type LoggerAPI = LoggerBase & {
    requestPath: string;
    requestVersion: string;
    user: {
        userUUID: string;
        loginSource: string;
        iat: number;
        exp: number;
    };
    durationMS: number;
};

export type LoggerAPIv2 = LoggerBase & {
    requestPath: string;
    requestID: string;
    sessionID: string;
    user: {
        userUUID: string;
        loginSource: string;
        iat: number;
        exp: number;
    };
    durationMS?: number;
};

export type LoggerService<T extends string> = LoggerBase & {
    serviceName: T;
    requestID: string;
    sessionID: string;
} & {
    [key in T]?: RecursionObject<string | number | boolean | undefined>;
};

export type LoggerSMS = LoggerBase & {
    sms: {
        phoneNumbers: string;
        signName: string;
        templateCode: string;
        verificationCode: string;
    };
    smsDetail: {
        code: string;
        message: string;
        bizId: string;
        requestId: string;
    };
};

export type LoggerEmail = LoggerBase & {
    email: {
        accountName: string;
        email: string;
        verificationCode: string;
    };
    emailDetail?: {
        envId: string;
        requestId: string;
        messageId: string;
    };
};

export type LoggerQueue = LoggerBase & {
    queue: {
        name: string;
    };
    queueDetail?: {
        jobID: string;
        status?: string;
        progress?: string;
    };
};

export type LoggerRTCScreenshot = LoggerQueue & {
    rtcDetail?: {
        roomUUID: string;
        resourceID?: string;
        sid?: string;
    };
};

export type LoggerRTCVoice = LoggerQueue & {
    rtcDetail?: {
        roomUUID: string;
        resourceID?: string;
        sid?: string;
    };
};

export type LoggerContentCensorship = LoggerBase & {
    censorship: {
        roomUUID: string;
    };
    censorshipDetail?: {
        jwtToken?: string;
        serverURL?: string;
        imageURL?: string;
        mockUserUUID?: string;
    };
    censorshipResult?: string;
};
