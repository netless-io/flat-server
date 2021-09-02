import { orm } from "../src/thirdPartyService/TypeORMService";

orm().then(async conn => {
    await conn.synchronize(true);
    await conn.close();
});
