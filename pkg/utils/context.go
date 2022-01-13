package utils

import (
	"context"

	"go.uber.org/zap"
)

func GetCtxField(ctx context.Context) zap.Field {
	requestID := ctx.Value("request_id").(string)
	return zap.String("request_id", requestID)
}
