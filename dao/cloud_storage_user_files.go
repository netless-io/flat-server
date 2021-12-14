package dao

import (
	"context"

	"github.com/netless-io/flat-server/logger"
	"github.com/netless-io/flat-server/model"
)

func FindUserStorageUserFile(traceLog logger.Logger, userUUID string, limit, offset int) ([]model.CloudStorageFiles, int, error) {

	ctx := context.WithValue(context.Background(), "logger", traceLog)
	defer ctx.Done()

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
