import { FastifyInstance } from "fastify/types/instance";
import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";
import RedisService from "../../thirdPartyService/RedisService";
import { Status } from "../../constants/Project";
import { ErrorCode } from "../../ErrorCode";

const BLOCK_RULE = [
    // 1分钟内最多5次
    {
        time: 60 * 1000,
        hmapKey: "minutes",
        maxCount: 5,
    },
    // 1小时内最多10次
    {
        time: 60 * 60 * 1000,
        hmapKey: "hours",
        maxCount: 10,
    },
    // 1天内最多30次
    {
        time: 60 * 60 * 24 * 1000,
        hmapKey: "days",
        maxCount: 30,
    },
]
const getKey = (ip: string, path: string) => `ipblock:${ip}:${path}`;

const check = (currentTime: number, lastActive: number, currentCount: number, rule: (typeof BLOCK_RULE)[number]): {
    blocked: boolean;
    reset: boolean;
} => {
    if (currentTime - lastActive < rule.time) {
        // 如果当前请求次数大于最大请求次数,则认为需要封禁
        if (currentCount > rule.maxCount) {
            return { blocked: true, reset: false };
        }
        // 如果当前请求次数小于最大请求次数,则认为不需要封禁
        return { blocked: false, reset: false };
    } else {
        // 只有在活跃时间超过最后活跃时间后,才重置当前计数
        return { blocked: false, reset: true };
    }
}

const plugin = async (instance: FastifyInstance, _opts: any): Promise<void> => {
    instance.decorate(
        "ipblock",
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const ip = request.ip;
            // 在redis里,key为ipblock:${ip}:${path},类型为hmap,hmap中设置以下字段:
            // - lastActive: 上次活跃时间
            // - minutes: 分钟内请求次数
            // - hours: 小时内请求次数
            // - days: 天内请求次数
            const key = getKey(ip, request.url);
            const currentTime = Date.now();
            const value = await RedisService.hmget(key, ["lastActive", ...BLOCK_RULE.map(rule => rule.hmapKey)]);
            // 第一次访问
            if (value === null) {
                await RedisService.hmset(key,
                    {
                        lastActive: currentTime.toString(),
                        ...Object.fromEntries(BLOCK_RULE.map(rule => [rule.hmapKey, "1"] as [string, string]))
                    });
                return;
            }
            const updatedValue: Record<string, string> = {
                lastActive: currentTime.toString(),
                ...Object.fromEntries(BLOCK_RULE.map((rule, index) => [rule.hmapKey, (Number(value[index + 1]) + 1).toString()] as [string, string]))
            };
            for (let index = 0; index < BLOCK_RULE.length; index++) {
                const rule = BLOCK_RULE[index];
                const { blocked, reset } = check(currentTime, Number(value[0]), Number(value[index + 1]), rule);
                // 如果被封禁则不进行更新
                if (blocked) {
                    reply.code(403).send({
                        status: Status.Failed,
                        code: ErrorCode.ExhaustiveAttack,
                    });
                    return;
                }
                if (reset) {
                    updatedValue[rule.hmapKey] = "0";
                }
            }
            // 更新redis
            await RedisService.hmset(key, updatedValue);
        },
    );
};

export const fastifyIpBlock = fp(plugin);