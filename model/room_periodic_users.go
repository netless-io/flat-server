package model

import (
	"time"
)

// RoomPeriodicUsersColumns get sql column name.
var RoomPeriodicUsersColumns = struct {
	ID           string
	CreatedAt    string
	UpdatedAt    string
	Version      string
	PeriodicUUID string
	UserUUID     string
	IsDelete     string
}{
	ID:           "id",
	CreatedAt:    "created_at",
	UpdatedAt:    "updated_at",
	Version:      "version",
	PeriodicUUID: "periodic_uuid",
	UserUUID:     "user_uuid",
	IsDelete:     "is_delete",
}

// RoomPeriodicUsers [...]
type RoomPeriodicUsers struct {
	ID           int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt    time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt    time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version      int       `gorm:"column:version;type:int(11);not null"`
	PeriodicUUID string    `gorm:"uniqueIndex:room_periodic_periodic_uuid_user_uuid_uindex;index:room_periodic_users_room_uuid_index;column:periodic_uuid;type:varchar(40);not null"`
	UserUUID     string    `gorm:"uniqueIndex:room_periodic_periodic_uuid_user_uuid_uindex;index:room_periodic_users_user_uuid_index;column:user_uuid;type:varchar(40);not null"`
	IsDelete     int8      `gorm:"index:room_periodic_users_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *RoomPeriodicUsers) TableName() string {
	return "room_periodic_users"
}
