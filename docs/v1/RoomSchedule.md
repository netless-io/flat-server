```ts
type ScheduleRoomRequest = {
    title: string;
    type: RoomType;
    beginTime: number;
    endTime: number;
    cyclical?: { weeks: Week[] } & ({ rate: number } | { endTime: number });
    docs?: {
        type: DocsType;
        uuid: string;
    }[];
};

type ScheduleRoomSuccessResponse = {
    status: Status.Success;
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
