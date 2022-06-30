import Ajv, { ValidateFunction } from "ajv";
import { ajvTypeBoxPlugin } from "@fastify/type-provider-typebox";

export class Schema {
    public static check(schema: any, obj: any): ValidateFunction["errors"] {
        const ajv = new Ajv();
        ajvTypeBoxPlugin(ajv);
        const validate = ajv.compile(schema);
        validate(obj);

        return validate.errors;
    }
}
