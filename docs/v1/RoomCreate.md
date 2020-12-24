```ts
type CreateRoomRequest = {
    title: string; // max: 50
    type: RoomType;
    beginTime: number;
    docs?: {
        type: DocsType;
        uuid: string;
    }[];
};

type CreateRoomSuccessResponse = {
    status: Status.Success;
    data: {
        roomUUID: string;
    };
};

enum RoomType {
    OneToOne,
    SmallClass,
    BigClass,
}

enum Week {
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
}

enum DocsType {
    Dynamic = "Dynamic",
    Static = "Static",
}
```
