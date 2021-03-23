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

        for await (const item of stream) {
            result = result.concat(item as string);

            if (totalCount && result.length >= realCount) {
                result.splice(realCount);
                break;
            }
        }

        stream.destroy();
        return Array.from(new Set(result));
    }
}

export default new RedisService();
