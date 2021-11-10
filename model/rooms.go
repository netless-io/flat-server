package model

import (
	"time"
)

// RoomsColumns get sql column name.
var RoomsColumns = struct {
	ID                 string
	CreatedAt          string
	UpdatedAt          string
	Version            string
	RoomUUID           string
	PeriodicUUID       string
	OwnerUUID          string
	Title              string
	RoomType           string
	RoomStatus         string
	BeginTime          string
	EndTime            string
	WhiteboardRoomUUID string
	IsDelete           string
	Region             string
}{
	ID:                 "id",
	CreatedAt:          "created_at",
	UpdatedAt:          "updated_at",
	Version:            "version",
	RoomUUID:           "room_uuid",
	PeriodicUUID:       "periodic_uuid",
	OwnerUUID:          "owner_uuid",
	Title:              "title",
	RoomType:           "room_type",
	RoomStatus:         "room_status",
	BeginTime:          "begin_time",
	EndTime:            "end_time",
	WhiteboardRoomUUID: "whiteboard_room_uuid",
	IsDelete:           "is_delete",
	Region:             "region",
}

// Rooms [...]
type Rooms struct {
	ID                 int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt          time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt          time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version            int       `gorm:"column:version;type:int(11);not null"`
	RoomUUID           string    `gorm:"unique;column:room_uuid;type:varchar(40);not null"`
	PeriodicUUID       string    `gorm:"index:rooms_periodic_uuid_index;column:periodic_uuid;type:varchar(40);not null"` // periodic uuid
	OwnerUUID          string    `gorm:"index:rooms_owner_uuid_index;column:owner_uuid;type:varchar(40);not null"`
	Title              string    `gorm:"column:title;type:varchar(150);not null"`                                                                  // room title
	RoomType           string    `gorm:"index:rooms_room_type_index;column:room_type;type:enum('OneToOne','BigClass','SmallClass');not null"`      // room type
	RoomStatus         string    `gorm:"index:rooms_room_status_index;column:room_status;type:enum('Idle','Started','Paused','Stopped');not null"` // current room status
	BeginTime          time.Time `gorm:"index:rooms_begin_time_index;column:begin_time;type:datetime(3);not null"`                                 // room begin time
	EndTime            time.Time `gorm:"column:end_time;type:datetime(3);not null"`                                                                // room end time
	WhiteboardRoomUUID string    `gorm:"unique;column:whiteboard_room_uuid;type:varchar(40);not null"`
	IsDelete           int8      `gorm:"index:rooms_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
	Region             string    `gorm:"column:region;type:enum('cn-hz','us-sv','sg','in-mum','gb-lon');not null"`
}

// TableName get sql table name.
func (m *Rooms) TableName() string {
	return "rooms"
}
