const { merge } = require("webpack-merge");
const DotenvFlow = require("dotenv-flow-webpack");
const paths = require("./paths");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    entry: paths.testEntryFile,

    mode: "development",

    devtool: "source-map",

    plugins: [
        new DotenvFlow({
            path: paths.envConfig,
            system_vars: true,
            default_node_env: "test",
        }),
    ],

    output: {
        filename: "index.js",
        path: paths.testDist,
        devtoolModuleFilenameTemplate: "[absolute-resource-path]",
        devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]",
    },
});
