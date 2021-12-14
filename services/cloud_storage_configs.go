package services

import (
	"github.com/netless-io/flat-server/dao"
	errCode "github.com/netless-io/flat-server/errors"
	"github.com/netless-io/flat-server/logger"
	"github.com/netless-io/flat-server/model"
)

type ListStorageConfig struct {
	TotalUsage int                       `json:"totalUsage"`
	Files      []model.CloudStorageFiles `json:"files,omitempty"`
}

func CloudStorageUserFileList(traceLog logger.Logger, userUUID string, limit, offset int) (ListStorageConfig, error) {
	traceLog.Info("CloudStorageUserFileList")

	files, totalUsage, err := dao.FindUserStorageUserFile(traceLog, userUUID, limit, offset)
	if err != nil {
		traceLog.Error(err)
		return ListStorageConfig{}, errCode.ServerFail
	}

	return ListStorageConfig{
		TotalUsage: totalUsage,
		Files:      files,
	}, nil
}
