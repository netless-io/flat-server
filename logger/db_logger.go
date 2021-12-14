package logger

import (
	"context"
	"errors"
	"time"

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
	getTraceLogger(ctx).Infof(k, v...)
}

func (d *DBLogger) Warn(ctx context.Context, k string, v ...interface{}) {
	getTraceLogger(ctx).(Logger).Warnf(k, v...)
}

func (d *DBLogger) Error(ctx context.Context, k string, v ...interface{}) {
	getTraceLogger(ctx).Errorf(k, v...)
}

func (d *DBLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	sql, rowsAffected := fc()

	elapsed := time.Since(begin)
	tracelog := getTraceLogger(ctx)

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		tracelog.Errorw(err.Error(), zap.String("sql", sql), zap.String("expenditure", elapsed.String()), zap.Int64("rowsAffected", rowsAffected))
		return
	}

	tracelog.Debugw("success", zap.String("sql", sql), zap.String("expenditure", elapsed.String()), zap.Int64("rowsAffected", rowsAffected))

}

func getTraceLogger(ctx context.Context) Logger {
	traceLog, ok := ctx.Value("logger").(Logger)
	if !ok {
		traceLog = logger
	}

	return traceLog
}
