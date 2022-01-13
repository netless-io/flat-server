package dao

import (
	"context"

	"github.com/netless-io/flat-server/model"
	"gorm.io/gorm"
)

type CloudStorageUserFilesMgr struct {
	db *gorm.DB
}

func NewCloudStorageUserFilesMgr(db *gorm.DB) *CloudStorageUserFilesMgr {

	return &CloudStorageUserFilesMgr{db: db}
}

func (c *CloudStorageUserFilesMgr) FindUserStorageFiles(ctx context.Context, userUUID string, limit, offset int) (result []model.CloudStorageFiles, err error) {
	err = c.db.WithContext(ctx).Model(&model.CloudStorageUserFiles{}).
		Where(
			&model.CloudStorageUserFiles{
				UserUUID: userUUID,
				IsDelete: 0,
			},
		).Joins(" INNER JOIN cloud_storage_files csf ON cloud_storage_user_files.file_uuid = csf.file_uuid").
		Offset(offset).
		Limit(limit).
		Scan(&result).Error
	return
}

func FindUserStorageUserFile(ctx context.Context, userUUID string, limit, offset int) ([]model.CloudStorageFiles, int, error) {

	userStorageInfo, err := cloudStorageConfigModel.FindOne(ctx, userUUID)
	if err != nil {
		return nil, 0, err
	}

	if userStorageInfo.TotalUsage == 0 {
		return nil, 0, nil
	}

	cloudStorageConfigs, err := cloudStorageUserFilesModel.FindUserStorageFiles(ctx, userUUID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return cloudStorageConfigs, int(userStorageInfo.TotalUsage), nil

}
