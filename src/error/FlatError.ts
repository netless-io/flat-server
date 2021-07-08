export class FlatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FlatError";
    }
}
