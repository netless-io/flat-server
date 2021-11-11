package model

import (
	"time"
)

// RoomDocsColumns get sql column name.
var RoomDocsColumns = struct {
	ID           string
	CreatedAt    string
	UpdatedAt    string
	Version      string
	RoomUUID     string
	PeriodicUUID string
	DocUUID      string
	DocType      string
	IsPreload    string
	IsDelete     string
}{
	ID:           "id",
	CreatedAt:    "created_at",
	UpdatedAt:    "updated_at",
	Version:      "version",
	RoomUUID:     "room_uuid",
	PeriodicUUID: "periodic_uuid",
	DocUUID:      "doc_uuid",
	DocType:      "doc_type",
	IsPreload:    "is_preload",
	IsDelete:     "is_delete",
}

// RoomDocs [...]
type RoomDocs struct {
	ID           int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt    time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt    time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version      int       `gorm:"column:version;type:int(11);not null"`
	RoomUUID     string    `gorm:"index:room_docs_room_uuid_index;column:room_uuid;type:varchar(40);not null"`
	PeriodicUUID string    `gorm:"index:room_docs_periodic_uuid_index;column:periodic_uuid;type:varchar(40);not null"`
	DocUUID      string    `gorm:"index:room_docs_doc_uuid_index;column:doc_uuid;type:varchar(40);not null"`
	DocType      string    `gorm:"column:doc_type;type:enum('Dynamic','Static');not null"`
	IsPreload    int8      `gorm:"index:room_docs_is_preload_index;column:is_preload;type:tinyint(4);not null"`
	IsDelete     int8      `gorm:"index:room_docs_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *RoomDocs) TableName() string {
	return "room_docs"
}
