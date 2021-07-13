export const isASC = (arr: Array<number>): boolean => {
    let lastResult = arr[0];
    for (let i = 1; i < arr.length; i++) {
        const item = arr[i];

        if (lastResult > item) {
            return false;
        }

        lastResult = item;
    }

    return true;
};

export const isDESC = (arr: Array<number>): boolean => {
    let lastResult = arr[0];
    for (let i = 1; i < arr.length; i++) {
        const item = arr[i];

        if (lastResult < item) {
            return false;
        }

        lastResult = item;
    }

    return true;
};
