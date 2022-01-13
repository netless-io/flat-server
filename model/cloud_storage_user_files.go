package model

import (
	"time"
)

// CloudStorageUserFilesColumns get sql column name.
var CloudStorageUserFilesColumns = struct {
	ID        string
	CreatedAt string
	UpdatedAt string
	Version   string
	FileUUID  string
	UserUUID  string
	IsDelete  string
}{
	ID:        "id",
	CreatedAt: "created_at",
	UpdatedAt: "updated_at",
	Version:   "version",
	FileUUID:  "file_uuid",
	UserUUID:  "user_uuid",
	IsDelete:  "is_delete",
}

// CloudStorageUserFiles [...]
type CloudStorageUserFiles struct {
	ID        int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version   int       `gorm:"column:version;type:int(11);not null"`
	FileUUID  string    `gorm:"uniqueIndex:cloud_storage_user_files_file_uuid_user_uuid_uindex;index:cloud_storage_user_files_file_uuid_index;column:file_uuid;type:varchar(40);not null"`
	UserUUID  string    `gorm:"uniqueIndex:cloud_storage_user_files_file_uuid_user_uuid_uindex;index:cloud_storage_user_files_user_uuid_index;column:user_uuid;type:varchar(40);not null"`
	IsDelete  int8      `gorm:"index:cloud_storage_user_files_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *CloudStorageUserFiles) TableName() string {
	return "cloud_storage_user_files"
}
