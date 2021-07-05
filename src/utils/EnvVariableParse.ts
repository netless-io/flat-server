export class EnvVariableParse {
    private readonly envReg: RegExp;

    public constructor(
        private readonly variables: Record<string, VariableValue>,
        private readonly prefix = "{{",
        private readonly suffix = "}}",
    ) {
        this.envReg = new RegExp(
            EnvVariableParse.autoAddBackslash(this.prefix) +
                "\\s*[a-z_A-Z]+\\s*" +
                EnvVariableParse.autoAddBackslash(this.suffix),
            "g",
        );
    }

    public parse(env: string): string {
        let result = "";
        let endIndex = 0;

        const matchesArray = Array.from(env.matchAll(this.envReg));

        if (matchesArray.length === 0) {
            return env;
        }

        const matches = matchesArray.entries();

        for (const [index, match] of matches) {
            result += env.slice(endIndex, match.index);

            result += this.getVariableValue(match[0]);

            endIndex = match.index! + match[0].length;
            if (index === matchesArray.length - 1) {
                result += env.slice(endIndex);
            }
        }
        return result;
    }

    private getVariableValue(variable: string): string {
        // remove prefix, suffix and space
        const v = variable
            .slice(this.prefix.length)
            .slice(0, this.suffix.length * -1)
            .trim();

        if (v in this.variables) {
            return EnvVariableParse.stringify(this.variables[v]);
        }

        return "";
    }

    private static stringify(value: VariableValue): string {
        if (typeof value === "function") {
            return String(value());
        } else {
            return String(value);
        }
    }

    private static autoAddBackslash(v: string): string {
        const needEscapeChar = ["$", "[", "]", "^", "*", "(", ")"];
        let result = "";

        for (const char of v) {
            if (needEscapeChar.includes(char)) {
                result += `\\${char}`;
            } else {
                result += char;
            }
        }

        return result;
    }
}

export type VariableValue = string | number | (() => string | number);
