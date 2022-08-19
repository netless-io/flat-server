import { ServiceID, ServicesCatalogParams, ServicesInstance } from "./catalog";
import { ServiceLocator } from "./service-locator";

export const useService = <T extends ServiceID>(service: T): ServicesInstance<T> => {
    return ServiceLocator.getInstance().requestService(service);
};

export const useOnceService = <T extends ServiceID>(
    service: T,
    params: ServicesCatalogParams[T],
): ServicesInstance<T> => {
    return ServiceLocator.getInstance().getOnceService(service, params);
};

export const registerService = <T extends ServiceID>(
    service: T,
    creator: (params?: ServicesCatalogParams[T]) => ServicesInstance<T>,
): void => {
    // @ts-ignore
    ServiceLocator.getInstance().register(service, creator);
};
