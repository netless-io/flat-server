import { Registry } from "prom-client";
import fastify, { FastifyInstance } from "fastify";
import { metricsConfig } from "../constants/Process";
import { loggerServer, parseError } from "../logger";

type MetricsParams = {
    appServer: FastifyInstance;
    port: number;
    endpoint: string;
};

export class MetricsSever {
    private params: MetricsParams;
    constructor(appServer: FastifyInstance) {
        this.params = {
            endpoint: metricsConfig.ENDPOINT,
            port: metricsConfig.PORT,
            appServer: appServer,
        };
    }

    public start(): void {
        const client = new Registry();
        let metricsServer = null;
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
            metricsServer.listen(this.params.port, "0.0.0.0", (err, address) => {
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
