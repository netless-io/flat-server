/* eslint-disable @typescript-eslint/no-unused-vars */

type AnyObj = {
    [key in string]: any;
};

type CapitalizeKeys<T extends Record<string, any>> = {
    [K in Capitalize<string & keyof T>]: T[Uncapitalize<K>];
};
