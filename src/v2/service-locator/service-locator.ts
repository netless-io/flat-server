import {
    ServicesCreatorCatalog,
    ServiceID,
    ServicesCatalog,
    ServicesPendingCatalog,
    ServicesCatalogParams,
} from "./catalog";

export class ServiceLocator {
    private registry: Partial<ServicesCreatorCatalog> = {};
    private services: Partial<ServicesPendingCatalog> = {};

    private constructor() {}

    public static getInstance(): ServiceLocator {
        return ((global as any).__SERVICE_LOCATOR ||= new ServiceLocator()) as ServiceLocator;
    }

    public register<T extends ServiceID>(name: T, serviceCreator: ServicesCreatorCatalog[T]): void {
        if (this.isRegistered(name)) {
            throw new Error(`${name} is already registered`);
        }
        this.registry[name] = serviceCreator;
    }

    public requestService<T extends ServiceID>(name: T): ServicesCatalog[T] {
        if (this.services[name]) {
            return this.services[name] as ServicesCatalog[T];
        }
        const creator = this.registry[name];
        if (creator) {
            return ((this.services[name] as any) = creator());
        }
        throw new Error(`service ${name} is not registered`);
    }

    public getOnceService<T extends ServiceID>(
        name: T,
        params: ServicesCatalogParams[T],
    ): ServicesCatalog[T] {
        const creator = this.registry[name];
        if (creator) {
            return creator(params);
        }
        throw new Error(`registry ${name} is not registered`);
    }

    public isRegistered(name: ServiceID): boolean {
        return Boolean(this.registry[name]);
    }
}
