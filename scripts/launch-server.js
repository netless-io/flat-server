const path = require("path");
const nodemon = require("nodemon");

const distPath = path.resolve(__dirname, "..", "dist", "index.js");

nodemon(`nodemon --watch ${distPath} --exec "node ${distPath}"`).on("quit", () => {
    process.exit();
});
