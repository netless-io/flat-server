package model

import (
	"time"
)

// RoomRecordsColumns get sql column name.
var RoomRecordsColumns = struct {
	ID        string
	CreatedAt string
	UpdatedAt string
	Version   string
	RoomUUID  string
	BeginTime string
	EndTime   string
	AgoraSid  string
	IsDelete  string
}{
	ID:        "id",
	CreatedAt: "created_at",
	UpdatedAt: "updated_at",
	Version:   "version",
	RoomUUID:  "room_uuid",
	BeginTime: "begin_time",
	EndTime:   "end_time",
	AgoraSid:  "agora_sid",
	IsDelete:  "is_delete",
}

// RoomRecords [...]
type RoomRecords struct {
	ID        int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version   int       `gorm:"column:version;type:int(11);not null"`
	RoomUUID  string    `gorm:"index:room_records_room_uuid_index;column:room_uuid;type:varchar(40);not null"`
	BeginTime time.Time `gorm:"column:begin_time;type:datetime(3);not null"`           // room record begin time
	EndTime   time.Time `gorm:"column:end_time;type:datetime(3);not null"`             // room record end time
	AgoraSid  string    `gorm:"column:agora_sid;type:varchar(40);not null;default:''"` // agora record id
	IsDelete  int8      `gorm:"index:room_records_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *RoomRecords) TableName() string {
	return "room_records"
}
