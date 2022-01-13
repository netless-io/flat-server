package services

import (
	"context"

	"github.com/netless-io/flat-server/dao"
	errCode "github.com/netless-io/flat-server/errors"
	"github.com/netless-io/flat-server/logger"
	"github.com/netless-io/flat-server/model"
	"github.com/netless-io/flat-server/pkg/utils"
)

type ListStorageConfig struct {
	TotalUsage int                       `json:"totalUsage"`
	Files      []model.CloudStorageFiles `json:"files,omitempty"`
}

func CloudStorageUserFileList(ctx context.Context, userUUID string, limit, offset int) (ListStorageConfig, error) {

	logger.Infow("list cloud storage file", utils.GetCtxField(ctx))

	files, totalUsage, err := dao.FindUserStorageUserFile(ctx, userUUID, limit, offset)
	if err != nil {
		logger.Errorw(err.Error(), utils.GetCtxField(ctx))
		return ListStorageConfig{}, errCode.ServerFail
	}

	return ListStorageConfig{
		TotalUsage: totalUsage,
		Files:      files,
	}, nil
}
