const paths = require("./paths");
const ESLintPlugin = require("eslint-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { NoEmitOnErrorsPlugin } = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const CopyPlugin = require("file-loader");
const path = require("path");

module.exports = {
    entry: [paths.entryFile],
    target: "node",

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: true,
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.eta$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name]-[hash].[ext]",
                            outputPath: "eta-templates",
                            publicPath: "dist/eta-templates",
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },

    plugins: [
        new CleanWebpackPlugin(),
        new NoEmitOnErrorsPlugin(),
        new ESLintPlugin({
            fix: true,
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: paths.tsConfig,
                diagnosticOptions: {
                    semantic: true,
                    syntactic: true,
                    declaration: true,
                },
            },
        }),
    ],

    externals: [nodeExternals()],

    resolve: {
        extensions: [".ts", ".js"],
    },
    output: {
        filename: "index.js",
        path: paths.dist,
    },
};
