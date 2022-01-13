package dao

import (
	"context"

	"github.com/netless-io/flat-server/model"
	"gorm.io/gorm"
)

type CloudStorageConfigMgr struct {
	db *gorm.DB
}

func NewCloudStorageConfigMgr(db *gorm.DB) *CloudStorageConfigMgr {

	return &CloudStorageConfigMgr{db: db}
}

func (c *CloudStorageConfigMgr) GetTableName() string {
	return "cloud_storage_configs"
}

func (c *CloudStorageConfigMgr) FindOne(ctx context.Context, userUUID string) (result model.CloudStorageConfigs, err error) {
	err = c.db.WithContext(ctx).Model(&model.CloudStorageConfigs{}).
		Where(
			&model.CloudStorageConfigs{
				UserUUID: userUUID,
				IsDelete: 0,
			},
		).
		Find(&result).Error
	return
}
