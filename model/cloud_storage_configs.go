package model

import (
	"context"
	"time"

	"gorm.io/gorm"
)

// CloudStorageConfigsColumns get sql column name.
var CloudStorageConfigsColumns = struct {
	ID         string
	CreatedAt  string
	UpdatedAt  string
	Version    string
	UserUUID   string
	TotalUsage string
	IsDelete   string
}{
	ID:         "id",
	CreatedAt:  "created_at",
	UpdatedAt:  "updated_at",
	Version:    "version",
	UserUUID:   "user_uuid",
	TotalUsage: "total_usage",
	IsDelete:   "is_delete",
}

// CloudStorageConfigs [...]
type CloudStorageConfigs struct {
	ID         int64     `gorm:"primaryKey;column:id;type:bigint(20);not null" `
	CreatedAt  time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt  time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version    int       `gorm:"column:version;type:int(11);not null"`
	UserUUID   string    `gorm:"unique;column:user_uuid;type:varchar(40);not null"`
	TotalUsage uint64    `gorm:"column:total_usage;type:bigint(20) unsigned;not null;default:0"` // total cloud storage of a user (bytes)
	IsDelete   int8      `gorm:"index:cloud_storage_configs_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *CloudStorageConfigs) TableName() string {
	return "cloud_storage_configs"
}

type CloudStorageConfigMgr struct {
	db *gorm.DB
}

func NewCloudStorageConfigMgr(db *gorm.DB) *CloudStorageConfigMgr {

	return &CloudStorageConfigMgr{db: db}
}

func (c *CloudStorageConfigMgr) GetTableName() string {
	return "cloud_storage_configs"
}

func (c *CloudStorageConfigMgr) FindOne(ctx context.Context, userUUID string) (result CloudStorageConfigs, err error) {
	err = c.db.WithContext(ctx).Model(&CloudStorageConfigs{}).
		Where(
			&CloudStorageConfigs{
				UserUUID: userUUID,
				IsDelete: 0,
			},
		).
		Find(&result).Error
	return
}
