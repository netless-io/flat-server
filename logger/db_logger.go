package logger

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/netless-io/flat-server/pkg/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
	ormLogger "gorm.io/gorm/logger"
)

type DBLogger struct {
}

func NewDBLogger() ormLogger.Interface {

	return new(DBLogger)
}

func (d *DBLogger) LogMode(level ormLogger.LogLevel) ormLogger.Interface {

	return d
}

func (d *DBLogger) Info(ctx context.Context, k string, v ...interface{}) {
	logger.Infow(fmt.Sprintf(k, v...), utils.GetCtxField(ctx))
}

func (d *DBLogger) Warn(ctx context.Context, k string, v ...interface{}) {
	logger.Warnw(fmt.Sprintf(k, v...), utils.GetCtxField(ctx))
}

func (d *DBLogger) Error(ctx context.Context, k string, v ...interface{}) {
	logger.Errorw(fmt.Sprintf(k, v...), utils.GetCtxField(ctx))
}

func (d *DBLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	sql, rowsAffected := fc()

	elapsed := time.Since(begin)

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Errorw(err.Error(), utils.GetCtxField(ctx), zap.String("sql", sql), zap.String("expenditure", elapsed.String()), zap.Int64("rowsAffected", rowsAffected))
		return
	}

	logger.Debugw("success", utils.GetCtxField(ctx), zap.String("sql", sql), zap.String("expenditure", elapsed.String()), zap.Int64("rowsAffected", rowsAffected))

}
