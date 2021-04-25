import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "room_records",
})
export class RoomRecordModel extends Content {
    @Index("room_records_room_uuid_index")
    @Column({
        length: 40,
    })
    room_uuid: string;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "room record begin time",
    })
    begin_time: Date;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "room record end time",
    })
    end_time: Date;

    @Column({
        // 8 more bits for redundancy
        length: 40,
        comment: "agora record id",
        default: "",
    })
    agora_sid: string;

    @Index("room_records_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
