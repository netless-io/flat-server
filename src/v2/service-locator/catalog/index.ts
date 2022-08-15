import { OSSAbstract } from "../service/oss-abstract";

export interface ServicesCatalog {
    oss: OSSAbstract;
}

export interface ServicesCatalogParams {
    oss: IDS;
}

export type ServiceID = Extract<keyof ServicesCatalog, string>;

export type ServicesInstance<T extends ServiceID> = ServicesCatalog[T];

export type ServicesPendingCatalog = {
    [K in ServiceID]?: ServicesCatalog[K];
};

export type ServicesCreator<T extends ServiceID> = (
    params?: ServicesCatalogParams[T],
) => ServicesCatalog[T];

export type ServicesCreatorCatalog = {
    [K in ServiceID]: ServicesCreator<K>;
};
