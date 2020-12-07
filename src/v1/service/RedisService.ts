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
}

export default new RedisService();
