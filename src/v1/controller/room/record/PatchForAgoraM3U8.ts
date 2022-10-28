/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { createWriteStream, mkdir, readdirSync, statSync, rmdirSync, unlinkSync } from "fs";
import { join } from "path";
import nReadLines from "n-readlines";
import { isExistObject, ossClient } from "../../cloudStorage/alibabaCloud/Utils";

const mediaPrefixs = ["# Audio", "# Video"];
const m3u8Rex = /[a-z0-9_-]*\.m3u8/g;
async function patchLoopM3U8File(fileName: string, prefix: string, dirName: string): Promise<void> {
    let sequenceNum = 1;
    mkdir(dirName, () => {});
    const outName = `./${dirName}/${fileName}`;
    const file = new nReadLines(fileName);
    const writeFile = createWriteStream(outName);

    let stagedLines: string[] = [];
    let lineData;
    while ((lineData = file.next())) {
        const line: string = lineData.toString();
        const startWithMediaPrefix =
            mediaPrefixs.filter(prefix => line.startsWith(prefix)).length > 0;
        if (startWithMediaPrefix && stagedLines.length === 0) {
            stagedLines.push(line);
            continue;
        }
        if (stagedLines.length > 0) {
            stagedLines.push(line);
            const rexResult = m3u8Rex.exec(line);
            if (rexResult !== null && rexResult.length > 0) {
                const m3u8_url = rexResult[0];
                const exist = await isExistObject(prefix + m3u8_url);
                // If exist then write to file,
                // if not just ignore it
                if (exist) {
                    void rewriteM3U8Discontinuity(m3u8_url, dirName, prefix, sequenceNum);
                    sequenceNum += 1;
                    stagedLines.forEach(l => writeFile.write(l + "\n"));
                }
                stagedLines = [];
            }
            continue;
        }
        writeFile.write(`${line}\n`);
    }
}

const discontinuityString = "#EXT-X-DISCONTINUITY";
const versionRex = /#EXT-X-VERSION:\d/g;
async function rewriteM3U8Discontinuity(
    fileName: string,
    dir: string,
    prefix: string,
    sequenceNum: number,
): Promise<void> {
    const fullPath = `${prefix}${fileName}`;
    const ossResult = await ossClient.get(fullPath);
    const fileContent = ossResult.content.toString() as string;
    const h = fileContent.includes(discontinuityString);
    if (h) {
        const regResult = versionRex.exec(fileContent);
        if (regResult !== null) {
            const versionString = regResult[0];
            const replaceStr = `${versionString}\n#EXT-X-DISCONTINUITY-SEQUENCE:${sequenceNum}`;
            const newFileContent = fileContent.replace(versionString, replaceStr);
            const outName = `${dir}/${fileName}`;
            const writeFile = createWriteStream(outName);
            writeFile.write(newFileContent);
        }
    }
}

function removeDir(dir: string): void {
    const files = readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
        const newPath = join(dir, files[i]);
        const stat = statSync(newPath);
        if (stat.isDirectory()) {
            //如果是文件夹就递归下去
            removeDir(newPath);
        } else {
            //删除文件
            unlinkSync(newPath);
        }
    }
    rmdirSync(dir); //如果文件夹是空的，就将自己删除掉
}

async function patchForM3U8(fileName: string, prefix: string): Promise<void> {
    const dirName = fileName.replace(/\.m3u8$/, "");
    await patchLoopM3U8File(fileName, prefix, dirName);

    const files = readdirSync(dirName, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);

    for await (const fileName of files) {
        const fullFilePath = `${prefix}/${fileName}`;
        await ossClient.delete(fullFilePath);
        await ossClient.put(fullFilePath, join(dirName, fileName));
    }

    removeDir(dirName);
}

export { patchForM3U8 };
