const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

const prodConfig = () => {
    return {
        mode: "production",

        devtool: "source-map",

        optimization: {
            minimize: false,
            moduleIds: "named",
        },
    };
};

module.exports = merge(common, prodConfig());
