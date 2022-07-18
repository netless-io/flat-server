import Ajv, { ValidateFunction } from "ajv";
import { ajvTypeBoxPlugin } from "@fastify/type-provider-typebox";
import { ajvSelfPlugin } from "../../../../plugins/Ajv";

export class Schema {
    public static check(schema: any, obj: any): ValidateFunction["errors"] {
        const ajv = new Ajv({
            strict: true,
            strictTypes: false,
        });
        ajvTypeBoxPlugin(ajv);
        ajvSelfPlugin(ajv);
        const validate = ajv.compile(schema);
        validate(obj);

        return validate.errors;
    }
}
