module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["prettier", "@typescript-eslint"],
    parserOptions: {
        project: "./tsconfig.json",
    },
    ignorePatterns: ["scripts"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
        "plugin:prettier/recommended",
    ],
    rules: {
        "max-classes-per-file": ["warn", 5],
        "no-restricted-syntax": ["error", "WithStatement"],
        "no-continue": ["warn"],
        "no-constant-condition": ["error", { checkLoops: false }],
        "no-fallthrough": ["error"],
        "no-return-assign": ["error", "except-parens"],
        "@typescript-eslint/ban-ts-comment": ["off"],
        "padded-blocks": [
            "error",
            {
                classes: "never",
                switches: "never",
            },
            {
                allowSingleLineBlocks: false,
            },
        ],
        "no-param-reassign": [
            "error",
            {
                props: false,
            },
        ],
        "space-unary-ops": ["off"],
        "no-plusplus": [
            "error",
            {
                allowForLoopAfterthoughts: true,
            },
        ],

        "@typescript-eslint/no-shadow": ["off"],
        "@typescript-eslint/no-use-before-define": ["off"],
        "@typescript-eslint/no-empty-function": ["off"],
        "import/prefer-default-export": ["off"],
        "import/no-extraneous-dependencies": ["off"],
        "import/no-useless-path-segments": ["off"],
        "import/no-cycle": ["off"],
        "class-methods-use-this": ["off"],
        "default-case": ["off"],
        "no-return-await": ["off"],
        "no-restricted-properties": ["off"],
        "no-multi-assign": ["off"],
        "no-await-in-loop": ["off"],
        "arrow-body-style": ["off"],
        "no-underscore-dangle": ["off"],
        "guard-for-in": ["off"],
        "prefer-template": ["off"],
        "no-else-return": ["off"],
        "quote-props": ["off"],
        "no-console": ["off"],
        "object-curly-newline": ["off"],
        "no-unused-vars": ["off"],

        "@typescript-eslint/quotes": ["error", "double"],
        "@typescript-eslint/no-floating-promises": ["error"],
        "@typescript-eslint/no-misused-promises": ["off"],
        "@typescript-eslint/no-unsafe-member-access": ["off"],
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                vars: "all",
                args: "after-used",
                ignoreRestSiblings: false,
                argsIgnorePattern: "^_",
                caughtErrors: "all",
            },
        ],
        "@typescript-eslint/member-ordering": [
            "error",
            {
                default: ["field", "constructor", "method"],
            },
        ],
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            {
                allowExpressions: true,
                allowConciseArrowFunctionExpressionsStartingWithVoid: true,
            },
        ],
        "@typescript-eslint/lines-between-class-members": [
            "error",
            "none",
            {
                exceptAfterSingleLine: true,
            },
        ],
        "@typescript-eslint/naming-convention": [
            "error",
            {
                selector: "default",
                format: ["camelCase", "snake_case", "PascalCase"],
                leadingUnderscore: "allow",
            },
            {
                selector: "property",
                format: [],
                leadingUnderscore: "allow",
            },
            {
                selector: "variable",
                format: ["camelCase", "PascalCase", "snake_case", "UPPER_CASE"],
                leadingUnderscore: "allow",
            },
            {
                selector: "class",
                format: ["PascalCase"],
                leadingUnderscore: "allow",
            },
            {
                selector: "enumMember",
                format: ["PascalCase", "UPPER_CASE"],
                leadingUnderscore: "allow",
            },
            {
                selector: "enum",
                format: ["PascalCase"],
                leadingUnderscore: "allow",
            },
            {
                selector: "interface",
                format: ["PascalCase"],
                leadingUnderscore: "allow",
            },
            {
                selector: "typeAlias",
                format: ["PascalCase"],
                leadingUnderscore: "allow",
            },
            {
                selector: "typeParameter",
                format: ["UPPER_CASE"],
                leadingUnderscore: "allow",
            },
        ],
        "@typescript-eslint/no-unsafe-assignment": ["off"],
        "@typescript-eslint/no-non-null-assertion": ["off"],
        "@typescript-eslint/no-explicit-any": ["off"],
        "@typescript-eslint/no-empty-interface": ["off"],
    },
    overrides: [
        {
            files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
            rules: {
                "@typescript-eslint/explicit-function-return-type": "off",
                "@typescript-eslint/no-unsafe-argument": "off",
                "@typescript-eslint/no-unsafe-return": "off",
            },
        },
    ],
};
