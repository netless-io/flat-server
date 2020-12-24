```ts
type ListRoomsParams = {
    type: "all" | "today" | "cyclical" | "history";
};

type ListRoomsQuery = {
    /**
     * min: 1, max: 50
     */
    page: number;
};

type ListRoomsSuccessResponse = {
    status: status: Status.Success;
    data: ({ roomUUID: string } | { cyclicalUUID: string }) & {
        creatorUserUUIDL: string;
        title: string;
        beginTime: string;
        endTime?: string;
        roomStatus: "Pending" | "Running" | "Stopped";
        creatorUserName: string;
    }[];
};
```
