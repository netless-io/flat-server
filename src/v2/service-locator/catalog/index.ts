import { OSSAbstract } from "../service/oss-abstract";
import { ComplianceTextAbstract } from "../service/compliance-text-abstract";
import { ComplianceImageAbstract } from "../service/compliance-image-abstract";

export interface ServicesCatalog {
    oss: OSSAbstract;
    complianceText: ComplianceTextAbstract;
    complianceImage: ComplianceImageAbstract;
}

export interface ServicesCatalogParams {
    oss: IDS;
    complianceText: IDS;
    complianceImage: IDS;
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
