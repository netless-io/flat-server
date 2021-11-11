package model

import (
	"time"
)

// RoomPeriodicColumns get sql column name.
var RoomPeriodicColumns = struct {
	ID           string
	CreatedAt    string
	UpdatedAt    string
	Version      string
	PeriodicUUID string
	FakeRoomUUID string
	BeginTime    string
	EndTime      string
	RoomStatus   string
	IsDelete     string
}{
	ID:           "id",
	CreatedAt:    "created_at",
	UpdatedAt:    "updated_at",
	Version:      "version",
	PeriodicUUID: "periodic_uuid",
	FakeRoomUUID: "fake_room_uuid",
	BeginTime:    "begin_time",
	EndTime:      "end_time",
	RoomStatus:   "room_status",
	IsDelete:     "is_delete",
}

// RoomPeriodic [...]
type RoomPeriodic struct {
	ID           int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt    time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt    time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version      int       `gorm:"column:version;type:int(11);not null"`
	PeriodicUUID string    `gorm:"column:periodic_uuid;type:varchar(40);not null"`
	FakeRoomUUID string    `gorm:"unique;column:fake_room_uuid;type:varchar(40);not null"`
	BeginTime    time.Time `gorm:"index:room_periodic_begin_time_index;column:begin_time;type:datetime(3);not null"`                                 // room begin time
	EndTime      time.Time `gorm:"column:end_time;type:datetime(3);not null"`                                                                        // room end time
	RoomStatus   string    `gorm:"index:room_periodic_room_status_index;column:room_status;type:enum('Idle','Started','Paused','Stopped');not null"` // current room status
	IsDelete     int8      `gorm:"index:room_periodic_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *RoomPeriodic) TableName() string {
	return "room_periodic"
}
