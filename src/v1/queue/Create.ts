import { config } from "../../utils/ParseConfig";
import Bull, { Job, JobOptions, ProcessPromiseFunction, QueueOptions } from "bull";
import { LoggerQueue } from "../../logger/LogConext";
import { Logger, parseError } from "../../logger";

export class Queue<T> {
    private queue: Bull.Queue<T>;
    private logger: Logger<LoggerQueue>;

    public constructor(name: string, logger: Logger<LoggerQueue>) {
        this.queue = new Bull<T>(name, Queue.Conf);
        this.logger = logger;
        this.loggerHook();
    }

    public async add(data: T, opts: JobOptions): Promise<Job<T>> {
        return await this.queue.add(data, opts);
    }

    public handler(fn: ProcessPromiseFunction<T>): void {
        void this.queue.process(fn);
    }

    private loggerHook(): void {
        this.queue
            .on("active", job => {
                this.logger.debug("job active", {
                    queueDetail: {
                        jobID: String(job.id),
                        status: "active",
                    },
                });
            })
            .on("error", error => {
                this.logger.error("job error", parseError(error));
            })
            .on("waiting", jobID => {
                this.logger.debug("job waiting", {
                    queueDetail: {
                        jobID: String(jobID),
                        status: "waiting",
                    },
                });
            })
            .on("stalled", job => {
                this.logger.info("job stalled", {
                    queueDetail: {
                        jobID: String(job.id),
                        status: "stalled",
                    },
                });
            })
            .on("lock-extension-failed", (job, error) => {
                this.logger.error("job lock failed", {
                    ...{
                        queueDetail: {
                            jobID: String(job.id),
                            status: "lock-extension-failed",
                        },
                    },
                    ...parseError(error),
                });
            })
            .on("progress", (job, progress) => {
                this.logger.error("job progress", {
                    queueDetail: {
                        jobID: String(job.id),
                        status: "progress",
                        progress: JSON.stringify(progress),
                    },
                });
            })
            .on("completed", job => {
                this.logger.info("job completed", {
                    queueDetail: {
                        jobID: String(job.id),
                        status: "completed",
                    },
                });
            })
            .on("failed", (job, error) => {
                this.logger.error("job failed", {
                    ...{
                        queueDetail: {
                            jobID: String(job.id),
                            status: "failed",
                        },
                    },
                    ...parseError(error),
                });
            })
            .on("removed", job => {
                this.logger.debug("job removed", {
                    queueDetail: {
                        jobID: String(job.id),
                        status: "remove",
                    },
                });
            });
    }

    private static get Conf(): QueueOptions {
        return {
            redis: {
                host: config.redis.host,
                username: config.redis.username || undefined,
                password: config.redis.password,
                port: config.redis.port,
                db: config.redis.queueDB,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
            },
        };
    }
}
