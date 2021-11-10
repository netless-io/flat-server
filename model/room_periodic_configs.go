package model

import (
	"time"
)

// RoomPeriodicConfigsColumns get sql column name.
var RoomPeriodicConfigsColumns = struct {
	ID                  string
	CreatedAt           string
	UpdatedAt           string
	Version             string
	PeriodicUUID        string
	OwnerUUID           string
	Title               string
	RoomOriginBeginTime string
	RoomOriginEndTime   string
	Weeks               string
	Rate                string
	EndTime             string
	RoomType            string
	PeriodicStatus      string
	IsDelete            string
	Region              string
}{
	ID:                  "id",
	CreatedAt:           "created_at",
	UpdatedAt:           "updated_at",
	Version:             "version",
	PeriodicUUID:        "periodic_uuid",
	OwnerUUID:           "owner_uuid",
	Title:               "title",
	RoomOriginBeginTime: "room_origin_begin_time",
	RoomOriginEndTime:   "room_origin_end_time",
	Weeks:               "weeks",
	Rate:                "rate",
	EndTime:             "end_time",
	RoomType:            "room_type",
	PeriodicStatus:      "periodic_status",
	IsDelete:            "is_delete",
	Region:              "region",
}

// RoomPeriodicConfigs [...]
type RoomPeriodicConfigs struct {
	ID                  int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt           time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt           time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version             int       `gorm:"column:version;type:int(11);not null"`
	PeriodicUUID        string    `gorm:"unique;column:periodic_uuid;type:varchar(40);not null"`
	OwnerUUID           string    `gorm:"index:periodic_configs_owner_uuid_index;column:owner_uuid;type:varchar(40);not null"`
	Title               string    `gorm:"column:title;type:varchar(150);not null"`                                                                        // room title
	RoomOriginBeginTime time.Time `gorm:"column:room_origin_begin_time;type:datetime(3);not null"`                                                        // room origin begin time
	RoomOriginEndTime   time.Time `gorm:"column:room_origin_end_time;type:datetime(3);not null"`                                                          // room origin end time
	Weeks               string    `gorm:"column:weeks;type:varchar(13);not null"`                                                                         // periodic week
	Rate                int8      `gorm:"column:rate;type:tinyint(3);not null"`                                                                           // periodic rate (max 50)
	EndTime             time.Time `gorm:"column:end_time;type:datetime(3);not null"`                                                                      // periodic end time
	RoomType            string    `gorm:"index:room_periodic_configs_type_index;column:room_type;type:enum('OneToOne','BigClass','SmallClass');not null"` // room type
	PeriodicStatus      string    `gorm:"index:rooms_periodic_status_index;column:periodic_status;type:enum('Idle','Started','Stopped');not null"`        // current periodic status
	IsDelete            int8      `gorm:"index:periodic_configs_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
	Region              string    `gorm:"column:region;type:enum('cn-hz','us-sv','sg','in-mum','gb-lon');not null"`
}

// TableName get sql table name.
func (m *RoomPeriodicConfigs) TableName() string {
	return "room_periodic_configs"
}
