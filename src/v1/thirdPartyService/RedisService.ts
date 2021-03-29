import IORedis from "ioredis";
import { Redis } from "../../Constants";

class RedisService {
    private readonly client: IORedis.Redis;

    public constructor() {
        this.client = new IORedis({
            host: Redis.HOST,
            port: Number(Redis.PORT),
            password: Redis.PASSWORD,
            db: Number(Redis.DB),
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

    public async del(key: string): Promise<void> {
        await this.client.del(key);
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
        count = 100,
        totalCount: boolean | number = false,
    ): Promise<string[]> {
        const stream = this.client.scanStream({
            match,
            count,
        });

        const realCount = typeof totalCount === "boolean" ? count : totalCount;

        let result: string[] = [];

        return new Promise((resolve, reject) => {
            stream.on("data", data => {
                result = result.concat(data as string);

                if (totalCount && result.length >= realCount) {
                    result.splice(realCount);
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
}

export default new RedisService();
