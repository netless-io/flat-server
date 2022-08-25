import { dataSource } from "./utils/mysql";
import {
    calSize,
    deleteData,
    fileUUIDsToUserUUID,
    getLocalAndOnlineCoursewareData,
    SQLCountByLocalAndOnlineCourseware,
    updateTotalSize,
} from "./utils/sql";

const main = async () => {
    await dataSource.initialize();

    const countByLocalAndOnlineCourseware = await SQLCountByLocalAndOnlineCourseware();
    console.log(`local and online courseware count is: ${countByLocalAndOnlineCourseware}`);

    if (countByLocalAndOnlineCourseware == 0) {
        console.log("Skip");
        await dataSource.destroy();
        return;
    }

    const localAndOnlineCoursewareData = await getLocalAndOnlineCoursewareData();

    const userFiles = await fileUUIDsToUserUUID(localAndOnlineCoursewareData);

    const userSize = calSize(localAndOnlineCoursewareData, userFiles);

    for (const userUUID in userSize) {
        await updateTotalSize(userUUID, userSize[userUUID]);
    }

    for (const userUUID in userFiles) {
        await deleteData(userUUID, userFiles[userUUID]);
    }

    console.log("Done");

    await dataSource.destroy();
};

main().catch(console.error);
