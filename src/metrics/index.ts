import { collectDefaultMetrics, Registry } from "prom-client";
import fastify from "fastify";
import { MetricsConfig } from "../constants/Config";
import { loggerServer, parseError } from "../logger";
import { FastifyInstance } from "../types/Server";

type MetricsParams = {
    appServer: FastifyInstance;
    port: number;
    endpoint: string;
};

export class MetricsSever {
    private params: MetricsParams;

    constructor(appServer: FastifyInstance) {
        this.params = {
            endpoint: MetricsConfig.endpoint,
            port: MetricsConfig.port,
            appServer: appServer,
        };
    }

    public start(): void {
        const client = new Registry();
        collectDefaultMetrics({ register: client });
        let metricsServer: FastifyInstance;

        if (this.params.port) {
            metricsServer = fastify({
                caseSensitive: true,
            });
        } else {
            metricsServer = this.params.appServer;
        }
        metricsServer.get(this.params.endpoint, async (_, res) => {
            void res.type("text/plain").send(await client.metrics());
        });
        if (this.params.port !== 0) {
            metricsServer.listen({ host: "0.0.0.0", port: this.params.port }, (err, address) => {
                if (err) {
                    loggerServer.error("metrics server launch failed", parseError(err));
                    process.exit(1);
                }
                loggerServer.info(`metrics server launch success, ${address}`);
            });
        } else {
            loggerServer.info(`metrics server register to app, endpoint: ${this.params.endpoint}`);
        }
    }
}
