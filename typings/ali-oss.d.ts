import "ali-oss";

declare module "ali-oss" {
    interface NormalSuccessResponse {
        res: Omit<import("ali-oss").NormalSuccessResponse, "res">;
    }
}
