import { initService } from "./init-service";
import { retryPendingClassroomResourceConfirmations } from "../../classroomResource/ConfirmationOutbox";

export const initTasks = async (): Promise<void> => {
    const tasks = [initService];

    for (const task of tasks) {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await task();
    }

    setInterval(() => {
        void retryPendingClassroomResourceConfirmations();
    }, 30_000).unref();
};
