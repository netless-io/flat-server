import IORedis from "ioredis";
import { Redis } from "../constants/Config";

class RedisService {
    public readonly client: IORedis.Redis;

    public constructor() {
        this.client = new IORedis({
            host: Redis.host,
            port: Redis.port,
            username: Redis.username,
            password: Redis.password,
            db: Redis.db,
        });
    }

    public async set(key: string, value: string, expire?: number): Promise<string | null> {
        if (typeof expire !== "undefined") {
            return await this.client.set(key, value, "EX", expire);
        }

        return await this.client.set(key, value);
    }

    public async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    public async del(key: string | string[]): Promise<void> {
        await this.client.del(typeof key === "string" ? [key] : key);
    }

    public async delByPattern(pattern: string): Promise<void> {
        await this.scanCallback(async keys => {
            await this.del(keys);
        }, pattern);
    }

    public async incr(key: string): Promise<number> {
        return await this.client.incr(key);
    }

    public async ttl(key: string): Promise<number> {
        return await this.client.ttl(key);
    }

    public async expire(key: string, seconds: number): Promise<void> {
        await this.client.expire(key, seconds);
    }

    public async hmset(key: string, value: Record<string, string>, expire?: number): Promise<void> {
        await this.client.hmset(key, value);

        if (expire) {
            await this.client.expire(key, expire);
        }
    }

    public hmget(key: string, field: string): Promise<string | null>;
    public hmget(key: string, field: string[]): Promise<Array<string | null>>;
    public async hmget(
        key: string,
        field: string | string[],
    ): Promise<string | null | Array<string | null>> {
        if (typeof field === "string") {
            return (await this.client.hmget(key, [field]))[0];
        }

        return await this.client.hmget(key, field);
    }

    public async scan(
        match: string,
        count = 100, // max number of keys to return
    ): Promise<string[]> {
        const stream = this.client.scanStream({
            match,
            count: 100, // how many rows to scan on each iteration (a 'data' event)
        });

        let result: string[] = [];

        return new Promise((resolve, reject) => {
            stream.on("data", data => {
                result = result.concat(data as string);

                if (count && result.length >= count) {
                    result.splice(count);
                    stream.destroy();
                }
            });

            stream.on("close", () => {
                resolve(Array.from(new Set(result)));
            });
            stream.on("end", () => {
                resolve(Array.from(new Set(result)));
            });
            stream.on("error", reject);
        });
    }

    public async scanCallback(
        func: (key: string[]) => Promise<void>,
        match: string,
        count = 100,
    ): Promise<void> {
        const stream = this.client.scanStream({
            match,
            count,
        });

        stream.on("data", async (keys: string[]) => {
            if (keys.length > 0) {
                await func(keys);
            }
        });

        await new Promise((resolve, reject) => {
            stream.on("close", resolve);
            stream.on("end", resolve);
            stream.on("error", reject);
        });
    }

    public async mget(keys: string[]): Promise<(string | null)[]> {
        if (keys.length === 0) {
            return [];
        }

        return await this.client.mget(keys);
    }

    public async vacantKey(keys: string[]): Promise<string | null> {
        const valueResult = await this.mget(keys);

        for (let i = 0; i < valueResult.length; i++) {
            const value = valueResult[i];

            if (value === null) {
                return keys[i];
            }
        }

        return null;
    }

    public async vacantKeys(keys: string[]): Promise<string[]> {
        const result: string[] = [];
        const valueResult = await this.mget(keys);

        for (let i = 0; i < valueResult.length; i++) {
            const value = valueResult[i];

            if (value === null) {
                result.push(keys[i]);
            }
        }

        return result;
    }

    public async zadd(key: string, value: string, score: number, expire?: number): Promise<void> {
        await this.client.zadd(key, score, value);

        if (expire) {
            await this.client.expire(key, expire);
        }
    }

    public async zcard(key: string): Promise<number> {
        return await this.client.zcard(key);
    }
}

export default new RedisService();
