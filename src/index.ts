import "source-map-support/register";
import "reflect-metadata";
import fastify from "fastify";
import { Apple, MetricsConfig, Server } from "./constants/Config";
import { Status } from "./constants/Project";
import { ajvSelfPlugin } from "./plugins/Ajv";
import { dataSource, orm } from "./thirdPartyService/TypeORMService";
import { ErrorCode } from "./ErrorCode";
import { loggerServer, parseError } from "./logger";
import { MetricsSever } from "./metrics";
import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import pointOfView from "@fastify/view";
import cookie from "@fastify/cookie";
import { registerV1Routers } from "./utils/RegistryRouters";
import { httpRouters } from "./v1/Routes";
import { ajvTypeBoxPlugin, TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { v2Routes } from "./v2/controllers/routes";
import { registerV2Routers } from "./utils/registryRoutersV2";
import fastifyRequestID from "@fastify-userland/request-id";
import fastifyTypeORMQueryRunner from "@fastify-userland/typeorm-query-runner";
import { fastifyAPILogger } from "./plugins/fastify/api-logger";
import { initTasks } from "./v2/tasks";
import { fastifyAuthenticate } from "./plugins/fastify/authenticate";
import { fastifyIpBlock } from "./plugins/fastify/ipBlock";
import {
    getClassroomResourceProfile,
    getClassroomResourcePublicConfig,
    listClassroomResourcePublicConfigs,
} from "./classroomResource/Registry";
import { probeClassroomResourceProfile } from "./classroomResource/Health";
import { ClassroomResources } from "./constants/Config";
import { RoomModel } from "./model/room/Room";
import { RoomPeriodicConfigModel } from "./model/room/RoomPeriodicConfig";
import { RoomRecordModel } from "./model/room/RoomRecord";
import { assertClassroomResourceBindingIntegrity } from "./classroomResource/BindingIntegrity";
import { BindingMigrationRequest, migrateRoomBinding } from "./classroomResource/BindingMigration";

const app = fastify({
    caseSensitive: true,
    ajv: {
        plugins: [ajvTypeBoxPlugin, ajvSelfPlugin],
    },
}).withTypeProvider<TypeBoxTypeProvider>();

if (MetricsConfig.enabled) {
    new MetricsSever(app).start();
}

app.setErrorHandler((err, request, reply) => {
    if (err.validation) {
        void reply.status(200).send({
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        });
        return;
    }

    loggerServer.error("request unexpected interruption", parseError(err));

    if (!request.notAutoHandle) {
        void reply.status(200).send({
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        });
        return;
    }

    return new Error(`request-id: ${request.reqID}. session-id: ${request.sesID}`);
});

app.get("/apple-app-site-association", (_, reply) => {
    return reply
        .code(200)
        .header("Content-Type", "application/json; charset=utf-8")
        .send({
            applinks: {
                apps: [],
                details: [{ appID: Apple.appId, paths: ["*"] }],
            },
        });
});

app.get("/health-check", async (_req, reply) => {
    return reply.code(200).send();
});

app.get<{ Params: { key: string } }>(
    "/v1/internal/classroom-resources/profiles/:key/health",
    async (request, reply) => {
        const configuredToken = ClassroomResources?.billing_internal_token;
        if (!configuredToken || request.headers["x-internal-token"] !== configuredToken) {
            return reply.code(401).send({ status: 1, message: "unauthorized" });
        }
        try {
            const profile = getClassroomResourceProfile(request.params.key);
            const activeHealth = await probeClassroomResourceProfile(profile);
            return reply.code(200).send({
                status: 0,
                data: {
                    ...getClassroomResourcePublicConfig(request.params.key),
                    activeHealth,
                },
            });
        } catch (error) {
            return reply.code(503).send({
                status: 1,
                message:
                    error instanceof Error
                        ? error.message
                        : "classroom resource health check failed",
            });
        }
    },
);

app.get("/v1/internal/classroom-resources/profiles", async (request, reply) => {
    const configuredToken = ClassroomResources?.billing_internal_token;
    if (!configuredToken || request.headers["x-internal-token"] !== configuredToken) {
        return reply.code(401).send({ status: 1, message: "unauthorized" });
    }
    return reply.code(200).send({
        status: 0,
        data: listClassroomResourcePublicConfigs(),
    });
});

app.get("/v1/internal/classroom-resources/confirmation-failures", async (request, reply) => {
    const configuredToken = ClassroomResources?.billing_internal_token;
    if (!configuredToken || request.headers["x-internal-token"] !== configuredToken) {
        return reply.code(401).send({ status: 1, message: "unauthorized" });
    }
    const rows = await dataSource.query(
        `SELECT operation_id AS operationID, object_uuid AS objectUUID,
                    owner_uuid AS ownerUUID, object_type AS objectType,
                    attempt_count AS attemptCount, next_attempt_at AS nextAttemptAt,
                    last_error AS lastError, created_at AS createdAt, updated_at AS updatedAt
               FROM classroom_resource_confirmation_outbox
              WHERE status = 'pending'
                AND (attempt_count > 0 OR created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 MINUTE))
              ORDER BY updated_at ASC
              LIMIT 200`,
    );
    return reply.code(200).send({ status: 0, data: rows });
});

app.get<{ Params: { uuid: string } }>(
    "/v1/internal/classroom-resources/bindings/:uuid",
    async (request, reply) => {
        const configuredToken = ClassroomResources?.billing_internal_token;
        if (!configuredToken || request.headers["x-internal-token"] !== configuredToken) {
            return reply.code(401).send({ status: 1, message: "unauthorized" });
        }
        const room = await dataSource.getRepository(RoomModel).findOne({
            where: { room_uuid: request.params.uuid },
        });
        if (room) {
            const confirmations = (await dataSource.query(
                `SELECT operation_id AS operationID, status, attempt_count AS attemptCount,
                        next_attempt_at AS nextAttemptAt, last_error AS lastError,
                        confirmed_at AS confirmedAt, updated_at AS updatedAt
                   FROM classroom_resource_confirmation_outbox
                  WHERE object_uuid = ?
                  ORDER BY id DESC
                  LIMIT 1`,
                [room.room_uuid],
            )) as Array<Record<string, unknown>>;
            const recordings = await dataSource.getRepository(RoomRecordModel).find({
                where: { room_uuid: room.room_uuid },
                order: { created_at: "DESC" },
            });
            const providerMigrations = await dataSource.query(
                `SELECT operation_id AS operationID,
				        source_profile_key AS sourceProfileKey,
				        target_profile_key AS targetProfileKey,
				        reason, operator_uuid AS operatorUUID, status,
				        migrated_at AS migratedAt, created_at AS createdAt
				   FROM classroom_resource_binding_migrations
				  WHERE room_uuid = ?
				  ORDER BY id DESC
				  LIMIT 50`,
                [room.room_uuid],
            );
            return reply.send({
                status: 0,
                data: {
                    objectType: "room",
                    objectUUID: room.room_uuid,
                    ownerUUID: room.owner_uuid,
                    resourceProfileKey: room.classroom_resource_profile_key,
                    bindingSource: room.resource_binding_source,
                    boundAt: room.resource_bound_at,
                    classroomResource: getClassroomResourcePublicConfig(
                        room.classroom_resource_profile_key,
                    ),
                    billingConfirmation: confirmations[0] || null,
                    flatProviderMigrations: providerMigrations,
                    recordings: recordings.map(recording => ({
                        recordingID: recording.id,
                        resourceProfileKey: recording.classroom_resource_profile_key,
                        resourceID: recording.agora_resource_id,
                        sid: recording.agora_sid,
                        status: recording.recording_status,
                        storageBucket: recording.recording_storage_bucket,
                        storagePrefix: recording.recording_storage_prefix,
                        beginTime: recording.begin_time,
                        endTime: recording.end_time,
                    })),
                },
            });
        }
        const periodic = await dataSource.getRepository(RoomPeriodicConfigModel).findOne({
            where: { periodic_uuid: request.params.uuid },
        });
        if (periodic) {
            const confirmations = (await dataSource.query(
                `SELECT operation_id AS operationID, status, attempt_count AS attemptCount,
                        next_attempt_at AS nextAttemptAt, last_error AS lastError,
                        confirmed_at AS confirmedAt, updated_at AS updatedAt
                   FROM classroom_resource_confirmation_outbox
                  WHERE object_uuid = ?
                  ORDER BY id DESC
                  LIMIT 1`,
                [periodic.periodic_uuid],
            )) as Array<Record<string, unknown>>;
            return reply.send({
                status: 0,
                data: {
                    objectType: "periodic",
                    objectUUID: periodic.periodic_uuid,
                    ownerUUID: periodic.owner_uuid,
                    resourceProfileKey: periodic.classroom_resource_profile_key,
                    bindingSource: periodic.resource_binding_source,
                    boundAt: periodic.resource_bound_at,
                    classroomResource: getClassroomResourcePublicConfig(
                        periodic.classroom_resource_profile_key,
                    ),
                    billingConfirmation: confirmations[0] || null,
                },
            });
        }
        return reply.code(404).send({ status: 1, message: "binding not found" });
    },
);

app.post<{ Params: { uuid: string }; Body: BindingMigrationRequest }>(
    "/v1/internal/classroom-resources/bindings/:uuid/migrate",
    async (request, reply) => {
        const configuredToken = ClassroomResources?.billing_internal_token;
        if (!configuredToken || request.headers["x-internal-token"] !== configuredToken) {
            return reply.code(401).send({ status: 1, message: "unauthorized" });
        }
        try {
            const result = await migrateRoomBinding(dataSource, request.params.uuid, request.body);
            return reply.send({ status: 0, data: result });
        } catch (error) {
            request.log.warn(
                { error, roomUUID: request.params.uuid },
                "binding migration rejected",
            );
            return reply.code(409).send({
                status: 1,
                message: error instanceof Error ? error.message : "binding migration failed",
            });
        }
    },
);

void orm()
    .then(async dataSource => {
        await assertClassroomResourceBindingIntegrity(dataSource);
        await Promise.all([
            app.register(cookie),
            app.register(pointOfView, {
                engine: {
                    eta: require("eta"),
                },
            }),
            app.register(fastifyAuthenticate),
            app.register(fastifyIpBlock),
            app.register(cors, {
                methods: ["GET", "POST", "OPTIONS"],
                allowedHeaders: [
                    "Content-Type",
                    "Authorization",
                    "x-request-id",
                    "x-session-id",
                    "x-openflat-platform",
                    "x-openflat-version",
                    "x-openflat-build",
                    "x-openflat-protocol-version",
                ],
                maxAge: 100,
            }),
            app.register(formBody),
            app.register(fastifyRequestID),
        ]);

        {
            const respErr = JSON.stringify({
                status: Status.Failed,
                code: ErrorCode.CurrentProcessFailed,
            });
            await app.register(fastifyTypeORMQueryRunner, {
                dataSource,
                transaction: true,
                match: request => {
                    const path = request.routerPath || "";
                    return path.startsWith("/v2") && !path.includes("/region/configs");
                },
                respIsError: respStr => respStr === respErr,
            });
        }

        await app.register(fastifyAPILogger);

        registerV1Routers(app, httpRouters);
        registerV2Routers(app, v2Routes);

        await initTasks();
        app.listen(
            {
                port: Server.port,
                host: "0.0.0.0",
            },
            (err, address) => {
                if (err) {
                    loggerServer.error("server launch failed", parseError(err));
                    process.exit(1);
                }

                loggerServer.info(`server launch success, ${address}`);
            },
        );
    })
    .catch(error => {
        loggerServer.error("server initialization failed", parseError(error));
        process.exit(1);
    });
