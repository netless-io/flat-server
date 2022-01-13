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
	ID          int64     `gorm:"primaryKey;column:id;type:bigint(20);not null" json:"-"`
	CreatedAt   time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"-"`
	Version     int       `gorm:"column:version;type:int(11);not null" json:"-"`
	FileUUID    string    `gorm:"unique;column:file_uuid;type:varchar(40);not null" json:"fileUUID"`
	FileName    string    `gorm:"column:file_name;type:varchar(128);not null" json:"fileName"`     // file name
	FileSize    uint32    `gorm:"column:file_size;type:int(10) unsigned;not null" json:"fileSize"` // file size (bytes)
	FileURL     string    `gorm:"column:file_url;type:varchar(256);not null" json:"fileURL"`       // file url
	ConvertStep string    `gorm:"column:convert_step;type:enum('None','Converting','Done','Failed');not null;default:None" json:"convertStep"`
	TaskUUID    string    `gorm:"column:task_uuid;type:varchar(40);not null;default:''" json:"taskUUID"`    // netless conversion task uuid v1
	TaskToken   string    `gorm:"column:task_token;type:varchar(256);not null;default:''" json:"taskToken"` // generated from sdk token and task uuid
	IsDelete    int8      `gorm:"index:cloud_storage_files_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0" json:"-"`
	Region      string    `gorm:"column:region;type:enum('cn-hz','us-sv','sg','in-mum','gb-lon','none');not null" json:"region"`
}

// TableName get sql table name.
func (m *CloudStorageFiles) TableName() string {
	return "cloud_storage_files"
}
