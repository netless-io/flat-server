import { ServiceID, ServicesInstance } from "./catalog";
import { ServiceLocator } from "./service-locator";

export const useService = <T extends ServiceID>(service: T): ServicesInstance<T> => {
    return ServiceLocator.getInstance().requestService(service);
};

export const registerService = <T extends ServiceID>(
    service: T,
    creator: () => ServicesInstance<T>,
): void => {
    ServiceLocator.getInstance().register(service, creator);
};
