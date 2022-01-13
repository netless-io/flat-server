package dao

import (
	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/model"
)

var (
	cloudStorageUserFilesModel *CloudStorageUserFilesMgr
	cloudStorageConfigModel    *CloudStorageConfigMgr
)

func RegistryModel(sqlConf conf.MySQLConf) error {

	dbConn, err := model.OpenDBConn(sqlConf)
	if err != nil {
		return err
	}

	cloudStorageUserFilesModel = NewCloudStorageUserFilesMgr(dbConn)
	cloudStorageConfigModel = NewCloudStorageConfigMgr(dbConn)

	// TODO register other model ...
	return nil

}
