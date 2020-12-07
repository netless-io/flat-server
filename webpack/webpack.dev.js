const { merge } = require("webpack-merge");
const DotenvFlow = require("dotenv-flow-webpack");
const paths = require("./paths");
const common = require("./webpack.common.js");
const { NoEmitOnErrorsPlugin } = require("webpack");
const ExecCommandWebpackPlugin = require("./plugin/exec-command-webpack-plugin");

module.exports = merge(common, {
    mode: "development",

    devtool: "source-map",

    watch: true,
    watchOptions: {
        aggregateTimeout: 600,
        ignored: ["node_modules/**"],
    },

    devServer: {
        hot: true,
    },

    plugins: [
        new NoEmitOnErrorsPlugin(),
        new DotenvFlow({
            path: paths.envConfig,
            system_vars: true,
            default_node_env: "development",
        }),
        new ExecCommandWebpackPlugin("yarn run launch:server"),
    ],
});
