const path = require("path");

const resolvePath = (...relativePath) => path.resolve(__dirname, "..", ...relativePath);

module.exports = {
    dist: resolvePath("dist"),
    appSrc: resolvePath("src"),
    entryFile: resolvePath("src", "index.ts"),
    testEntryFile: resolvePath("test", "index.ts"),
    testDist: resolvePath("dist-test"),
    tsConfig: resolvePath("tsconfig.json"),
};
