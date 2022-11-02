/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { isExistObject, ossClient } from "../../cloudStorage/alibabaCloud/Utils";
import { Readable } from "stream";

const mediaPrefixs = ["# Audio", "# Video"];
async function patchLoopM3U8File(lines: string[], fileName: string, prefix: string): Promise<void> {
    let sequenceNum = 1;
    const modifiedLines: string[] = [];
    let stagedLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const startWithMediaPrefix =
            mediaPrefixs.filter(prefix => line.startsWith(prefix)).length > 0;
        if (startWithMediaPrefix && stagedLines.length === 0) {
            stagedLines.push(line);
            continue;
        }
        if (stagedLines.length > 0) {
            stagedLines.push(line);
            const rexResult = /[a-z0-9_-]*\.m3u8/g.exec(line);
            if (rexResult !== null && rexResult.length > 0) {
                const m3u8_url = rexResult[0];
                const ossPath = `${prefix}/${m3u8_url}`;
                const exist = await isExistObject(ossPath);
                // If exist then write to file,
                // if not just ignore it
                if (exist) {
                    void rewriteM3U8Discontinuity(m3u8_url, prefix, sequenceNum);
                    sequenceNum += 1;
                    stagedLines.forEach(l => modifiedLines.push(l));
                }
                stagedLines = [];
            }
            continue;
        }
        modifiedLines.push(line);
    }
    if (modifiedLines.length !== lines.length) {
        const content = modifiedLines.join("\n");
        await putStringToOss(`${prefix}/${fileName}`, content);
    }
}

const discontinuityString = "#EXT-X-DISCONTINUITY";
const discontinuitySequenceString = "#EXT-X-DISCONTINUITY-SEQUENCE";
async function rewriteM3U8Discontinuity(
    fileName: string,
    prefix: string,
    sequenceNum: number,
): Promise<void> {
    const fullPath = `${prefix}/${fileName}`;
    const ossResult = await ossClient.get(fullPath);
    const fileContent = ossResult.content.toString() as string;
    const containDsc = fileContent.includes(discontinuityString);
    const containDscs = fileContent.includes(discontinuitySequenceString);
    if (containDsc && !containDscs) {
        const versionRex = /#EXT-X-VERSION:\d/g;
        const regResult = versionRex.exec(fileContent);
        if (regResult !== null) {
            const versionString = regResult[0];
            const replaceStr = `${versionString}\n#EXT-X-DISCONTINUITY-SEQUENCE:${sequenceNum}`;
            const newFileContent = fileContent.replace(versionString, replaceStr);
            await putStringToOss(fullPath, newFileContent);
        }
    }
}

async function patchForM3U8(fileName: string, prefix: string): Promise<void> {
    const ossResult = await ossClient.get(`${prefix}/${fileName}`);
    const lines = (ossResult.content.toString() as string).split(/\r\n|\r|\n/g);
    await patchLoopM3U8File(lines, fileName, prefix);
}

async function putStringToOss(fileName: string, content: string): Promise<boolean> {
    const r = new Readable();
    r._read = () => {};
    r.push(content);
    r.push(null);
    const res = await ossClient.putStream(fileName, r);
    return res.res.status === 200;
}

export { patchForM3U8 };
