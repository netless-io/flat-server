const { merge } = require("webpack-merge");
const DotenvFlow = require("dotenv-flow-webpack");
const paths = require("./paths");
const common = require("./webpack.common.js");

const prodConfig = () => {
    const config = {
        mode: "production",

        devtool: "source-map",

        optimization: {
            minimize: false,
            moduleIds: "named",
        },
    };

    // if this value is undefined, it is considered to be a locally built production
    // If it is not undefined, it is considered to be built in docker, and DotenvFlow should not be used,
    // because the configuration of the production environment should be obtained through environment variables, rather than written to the code
    if (process.env.CONTEXT === undefined) {
        config.plugins = [
            new DotenvFlow({
                path: paths.envConfig,
                system_vars: true,
                default_node_env: "production",
            }),
        ];
    }

    return config;
};

module.exports = merge(common, prodConfig());
