package dao

import (
	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/model"
)

var (
	cloudStorageUserFilesModel *model.CloudStorageUserFilesMgr
	cloudStorageConfigModel    *model.CloudStorageConfigMgr
)

func RegistryModel(sqlConf conf.MySQLConf) error {
	dbConn, err := model.OpenDBConn(sqlConf)
	if err != nil {
		return err
	}

	cloudStorageUserFilesModel = model.NewCloudStorageUserFilesMgr(dbConn)
	cloudStorageConfigModel = model.NewCloudStorageConfigMgr(dbConn)

	// TODO register other model ...
	return nil

}
