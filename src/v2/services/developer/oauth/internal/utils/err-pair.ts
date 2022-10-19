export const errPairSync = async <T>(func: Promise<T>): Promise<[Error, null] | [null, T]> => {
    try {
        const result = await func;
        return [null, result];
    } catch (error) {
        return [error, null];
    }
};
