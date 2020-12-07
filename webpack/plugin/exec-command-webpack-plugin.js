const os = require("os");
const { spawn, exec } = require("child_process");

// by: https://github.com/cdeutsch/webpack-shell-plugin/blob/master/src/webpack-shell-plugin.js
class ExecCommandWebpackPlugin {
    constructor(script) {
        this.script = script;
    }

    puts(error) {
        if (error) {
            throw error;
        }
    }

    spreadStdoutAndStdErr(proc) {
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stdout);
    }

    serializeScript(script) {
        if (typeof script === "string") {
            const [command, ...args] = script.split(" ");

            return { command, args };
        }
        const { command, args } = script;
        return { command, args };
    }

    handleScript(script) {
        if (os.platform() === "win32") {
            this.spreadStdoutAndStdErr(exec(script, this.puts));
        } else {
            const { command, args } = this.serializeScript(script);
            const proc = spawn(command, args);
            proc.on("close", this.puts);
            proc.stdout.pipe(process.stdout);
        }
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync("ExecCommandWebpackPlugin", (compilation, callback) => {
            if (this.script !== "") {
                this.handleScript(this.script);
                this.script = "";
            }
            callback();
        });
    }
}

module.exports = ExecCommandWebpackPlugin;
