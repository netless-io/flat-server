## General

Response will always be:

```ts
type Response =
    | { status: Status.Success; data: unknown }
    | { status: Exclude<Status, Status.Success>; message: string };

enum Status {
    NoLogin = -1,
    Success,
    Failed,
    Process,
    AuthFailed,
}
```

## Rooms

### Create Room

```ruby
POST room/create
{ title, type, beginTime, docs? }
=>
{ status: 0, data: { roomUUID } }
```

For type declarations see [Create Room](./RoomCreate.md).

### Schedule Room

```ruby
POST room/schedule
{ title, type, beginTime, endTime, cyclical?, docs? }
=>
{ status: 0 }
```

For type declarations see [Schedule Room](./RoomSchedule.md).

### List Rooms

```ruby
GET room/list/:type?page=1 # type: "all" | "today" | "cyclical" | "history"
=>
{ status: 0,
  data: {
    roomUUID?, cyclicalUUID?, creatorUserUUID, creatorUserName,
    title, beginTime, endTime?, roomStatus # roomStatus: "Pending" | "Running" | "Stopped"
  }[]
}
```

For type declarations see [List Rooms](./RoomList.md).

### Join Room

```ruby
POST room/join/ordinary
{ roomUUID }
=>
{ whiteboardRoomToken, whiteboardRoomUUID }
```

```ruby
POST room/join/cyclical
{ cyclicalUUID }
=>
{ roomUUID, whiteboardRoomToken, whiteboardRoomUUID }
```

All fields' types are `string`.
