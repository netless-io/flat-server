package model

import (
	"time"
)

// CloudStorageFilesColumns get sql column name.
var CloudStorageFilesColumns = struct {
	ID          string
	CreatedAt   string
	UpdatedAt   string
	Version     string
	FileUUID    string
	FileName    string
	FileSize    string
	FileURL     string
	ConvertStep string
	TaskUUID    string
	TaskToken   string
	IsDelete    string
	Region      string
}{
	ID:          "id",
	CreatedAt:   "created_at",
	UpdatedAt:   "updated_at",
	Version:     "version",
	FileUUID:    "file_uuid",
	FileName:    "file_name",
	FileSize:    "file_size",
	FileURL:     "file_url",
	ConvertStep: "convert_step",
	TaskUUID:    "task_uuid",
	TaskToken:   "task_token",
	IsDelete:    "is_delete",
	Region:      "region",
}

// CloudStorageFiles [...]
type CloudStorageFiles struct {
	ID          int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt   time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt   time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version     int       `gorm:"column:version;type:int(11);not null"`
	FileUUID    string    `gorm:"unique;column:file_uuid;type:varchar(40);not null"`
	FileName    string    `gorm:"column:file_name;type:varchar(128);not null"`     // file name
	FileSize    uint32    `gorm:"column:file_size;type:int(10) unsigned;not null"` // file size (bytes)
	FileURL     string    `gorm:"column:file_url;type:varchar(256);not null"`      // file url
	ConvertStep string    `gorm:"column:convert_step;type:enum('None','Converting','Done','Failed');not null;default:None"`
	TaskUUID    string    `gorm:"column:task_uuid;type:varchar(40);not null;default:''"`   // netless conversion task uuid v1
	TaskToken   string    `gorm:"column:task_token;type:varchar(256);not null;default:''"` // generated from sdk token and task uuid
	IsDelete    int8      `gorm:"index:cloud_storage_files_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
	Region      string    `gorm:"column:region;type:enum('cn-hz','us-sv','sg','in-mum','gb-lon','none');not null"`
}

// TableName get sql table name.
func (m *CloudStorageFiles) TableName() string {
	return "cloud_storage_files"
}
