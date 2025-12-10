import { FastifyInstance } from "fastify/types/instance";
import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";
import RedisService from "../../thirdPartyService/RedisService";
import { Status } from "../../constants/Project";
import { ErrorCode } from "../../ErrorCode";
import { runTimeLogger } from "../../logger";
import { Server } from "../../constants/Config";

const getKey = (ip: string, path: string) => `ipblock:${ip}:${path}`;

const check = (currentTime: number, lastActive: number, currentCount: number, rule: { time: number, maxCount: number }): {
    blocked: boolean;
    reset: boolean;
} => {
    if (currentTime - lastActive < rule.time) {
        // 如果当前请求次数大于等于最大请求次数,则认为需要封禁
        if (currentCount >= rule.maxCount) {
            return { blocked: true, reset: false };
        }
        // 如果当前请求次数小于最大请求次数,则认为不需要封禁
        return { blocked: false, reset: false };
    } else {
        // 只有在活跃时间超过最后活跃时间后,才重置当前计数
        return { blocked: false, reset: true };
    }
}

const setRedisValue = async (key: string, value: Record<string, string>) => {
    await RedisService.hmset(key, value);
    // 1天过期
    await RedisService.expire(key, 60 * 60 * 24);
}

const plugin = async (instance: FastifyInstance, _opts: any): Promise<void> => {
    instance.decorate(
        "ipblock",
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const blockRule = [
                // 1分钟内最多5次
                {
                    time: 60 * 1000,
                    hmapKey: "minutes",
                    maxCount: Server.ipBlock.minutes,
                },
                // 1小时内最多10次
                {
                    time: 60 * 60 * 1000,
                    hmapKey: "hours",
                    maxCount: Server.ipBlock.hours,
                },
                // 1天内最多30次
                {
                    time: 60 * 60 * 24 * 1000,
                    hmapKey: "days",
                    maxCount: Server.ipBlock.days,
                },
            ]

            const ipFromHeader = request.headers["x-forwarded-for"] || request.headers["x-real-ip"];
            if (!ipFromHeader) {
                runTimeLogger.warn(`ip not found in headers`, {
                    headers: request.headers as any,
                });
                return;
            }
            let ip;
            if (ipFromHeader instanceof Array) {
                ip = ipFromHeader[0];
            } else {
                ip = ipFromHeader;
            }
            // 在redis里,key为ipblock:${ip}:${path},类型为hmap,hmap中设置以下字段:
            // - lastActive: 上次活跃时间
            // - minutes: 分钟内请求次数
            // - hours: 小时内请求次数
            // - days: 天内请求次数
            const key = getKey(ip, request.url);
            const currentTime = Date.now();
            const value = await RedisService.hmget(key, ["lastActive", ...blockRule.map(rule => rule.hmapKey)]);
            // 第一次访问
            if (value[0] === null) {
                runTimeLogger.debug(`first visit ip: ${ip}, path: ${request.url}`);
                await setRedisValue(key,
                    {
                        lastActive: currentTime.toString(),
                        ...Object.fromEntries(blockRule.map(rule => [rule.hmapKey, "1"] as [string, string]))
                    });
                return;
            }
            const updatedValue: Record<string, string> = {
                lastActive: currentTime.toString(),
                ...Object.fromEntries(blockRule.map((rule, index) => [rule.hmapKey, (Number(value[index + 1]) + 1).toString()] as [string, string]))
            };
            const lastActive = Number(value[0]);
            let resetAction = [];
            for (let index = 0; index < blockRule.length; index++) {
                const rule = blockRule[index];
                const { blocked, reset } = check(currentTime, lastActive, Number(value[index + 1]), rule);
                // 如果被封禁则不进行更新
                if (blocked) {
                    runTimeLogger.warn(`block client ip ${ip} for path ${request.url}, trigger rule ${rule.hmapKey}`)
                    await reply.code(200).send({
                        status: Status.Failed,
                        code: ErrorCode.ExhaustiveAttack,
                    });
                    return;
                }
                if (reset) {
                    resetAction.push(rule.hmapKey);
                }
            }
            for (const action of resetAction) {
                updatedValue[action] = "0";
                runTimeLogger.debug(`reset ip: ${ip}, path: ${request.url}, rule: ${action}`);
            }
            runTimeLogger.debug(`update ip: ${ip}, path: ${request.url}, updatedValue: ${JSON.stringify(updatedValue)}`);
            // 更新redis
            await setRedisValue(key, updatedValue);
        },
    );
};

export const fastifyIpBlock = fp(plugin);