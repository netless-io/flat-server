export const noDelete = <T>(
    where: T,
): T & {
    is_delete: false;
} => {
    return {
        ...where,
        is_delete: false,
    };
};
