package model

import (
	"time"
)

// RoomUsersColumns get sql column name.
var RoomUsersColumns = struct {
	ID        string
	CreatedAt string
	UpdatedAt string
	Version   string
	RoomUUID  string
	UserUUID  string
	RtcUID    string
	IsDelete  string
}{
	ID:        "id",
	CreatedAt: "created_at",
	UpdatedAt: "updated_at",
	Version:   "version",
	RoomUUID:  "room_uuid",
	UserUUID:  "user_uuid",
	RtcUID:    "rtc_uid",
	IsDelete:  "is_delete",
}

// RoomUsers [...]
type RoomUsers struct {
	ID        int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version   int       `gorm:"column:version;type:int(11);not null"`
	RoomUUID  string    `gorm:"uniqueIndex:room_users_room_uuid_rtc_uid_uindex;uniqueIndex:room_users_room_uuid_user_uuid_uindex;index:room_users_room_uuid_index;column:room_uuid;type:varchar(40);not null"`
	UserUUID  string    `gorm:"uniqueIndex:room_users_room_uuid_user_uuid_uindex;index:room_users_user_uuid_index;column:user_uuid;type:varchar(40);not null"`
	RtcUID    string    `gorm:"uniqueIndex:room_users_room_uuid_rtc_uid_uindex;column:rtc_uid;type:varchar(6);not null"` // front-end needs this field to set rtc
	IsDelete  int8      `gorm:"index:room_users_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *RoomUsers) TableName() string {
	return "room_users"
}
