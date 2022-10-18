import "fastify";

declare module "fastify" {
    interface FastifyRequest {
        notAutoHandle?: true;
    }
}
