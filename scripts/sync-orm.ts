import { orm } from "../src/thirdPartyService/TypeORMService";

orm().then(async datasource => {
    await datasource.synchronize(true);
    await datasource.destroy();
});
