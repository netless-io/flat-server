/* eslint-disable @typescript-eslint/no-unused-vars */

type RecursionObject<T> = {
    [key in string]: T | RecursionObject<T>;
};

type CapitalizeKeys<T extends Record<string, any>> = {
    [K in Capitalize<string & keyof T>]: T[Uncapitalize<K>];
};

type ValueInMapRecord<T> = T extends Map<any, infer I> ? I : never;

type IDS = import("@fastify-userland/request-id").FastifyRequestIDS;
