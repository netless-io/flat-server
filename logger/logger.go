package logger

import (
	"errors"
	"os"
	"path/filepath"
	"syscall"

	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/logger/storage"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var logger *zap.SugaredLogger

type Logger interface {
	Debug(args ...interface{})

	Debugf(template string, args ...interface{})

	Debugw(template string, args ...interface{})

	Info(args ...interface{})

	Infof(template string, args ...interface{})

	Infow(template string, args ...interface{})

	Warn(args ...interface{})

	Warnf(template string, args ...interface{})

	Warnw(template string, args ...interface{})

	Error(args ...interface{})

	Errorf(template string, args ...interface{})

	Errorw(template string, args ...interface{})
}

func New(loggerConf conf.LoggerConf) error {
	conf, err := createLogConf(loggerConf)
	if err != nil {
		return err
	}

	return conf.applyLogConfig()
}

func createLogConf(loggerConf conf.LoggerConf) (*LogConfig, error) {
	conf := new(LogConfig)
	defaultConf := defaultLogConf()

	defer func() {
		conf.atomicLevel = zap.NewAtomicLevel()
	}()

	// level filepath is null indicates that the log configuration is not specified
	if loggerConf.Level == "" && loggerConf.File.Path == "" {
		conf = defaultConf
		return conf, nil
	}

	conf.CallerSkip = defaultConf.CallerSkip
	conf.JsonFormat = defaultConf.JsonFormat

	if conf.Level = loggerConf.Level; conf.Level == "" {
		conf.Level = defaultConf.Level
	}

	if conf.StackTraceLevel = loggerConf.StackTraceLevel; conf.StackTraceLevel == "" {
		conf.StackTraceLevel = defaultConf.StackTraceLevel
	}

	if loggerConf.File.Path != "" {
		conf.File.Enable = true
		logFilePath, err := filepath.Abs(loggerConf.File.Path)
		if err != nil {
			return nil, err
		}

		conf.File.Path = logFilePath
		conf.File.Name = loggerConf.File.Name

		if conf.File.RotationCount = loggerConf.File.RotationCount; conf.File.RotationCount <= 0 {
			conf.File.RotationCount = defaultConf.File.RotationCount
		}

		if conf.File.RotationTime = loggerConf.File.RotationTime; conf.File.RotationTime <= 0 {
			conf.File.RotationTime = defaultConf.File.RotationTime
		}

	}

	if !loggerConf.DisableConsole {
		conf.Console = defaultConf.Console
	}

	return conf, nil
}

func (conf *LogConfig) applyLogConfig() error {

	var (
		cores   []zapcore.Core
		encoder zapcore.Encoder
	)

	if conf.JsonFormat {
		encoder = zapcore.NewJSONEncoder(getEncoderConf())
	} else {
		encoder = zapcore.NewConsoleEncoder(getEncoderConf())
	}

	conf.atomicLevel.SetLevel(getLevel(conf.Level))

	if conf.Console {
		writer := zapcore.Lock(os.Stdout)
		core := zapcore.NewCore(encoder, writer, conf.atomicLevel)
		cores = append(cores, core)
	}

	if conf.File.Enable {
		fileWriter := storage.LocalFileWriter(
			conf.File.Path,
			conf.File.Name,
			conf.File.RotationTime,
			conf.File.RotationCount,
		)

		writer := zapcore.AddSync(fileWriter)
		core := zapcore.NewCore(encoder, writer, conf.atomicLevel)
		cores = append(cores, core)
	}

	combinedCore := zapcore.NewTee(cores...)

	zapLog := zap.New(combinedCore,
		zap.AddCallerSkip(conf.CallerSkip),
		zap.AddStacktrace(getLevel(conf.StackTraceLevel)),
		zap.AddCaller(),
	)

	logger = zapLog.Sugar()

	// see: https://github.com/uber-go/zap/issues/880 and https://github.com/uber-go/zap/issues/991
	err := logger.Sync()
	if err != nil && !errors.Is(err, syscall.ENOTTY) {
		return err
	}

	return nil
}

func Debug(args ...interface{}) {
	logger.Debug(args...)
}

func Debugf(template string, args ...interface{}) {
	logger.Debugf(template, args...)
}

func Debugw(msg string, keysAndValues ...interface{}) {
	logger.Debugw(msg, keysAndValues...)
}

func Info(args ...interface{}) {
	logger.Info(args...)
}

func Infof(template string, args ...interface{}) {
	logger.Infof(template, args...)
}

func Infow(msg string, keysAndValues ...interface{}) {
	logger.Infow(msg, keysAndValues...)
}

func Warn(args ...interface{}) {
	logger.Warn(args...)
}

func Warnf(template string, args ...interface{}) {
	logger.Warnf(template, args...)
}

func Warnw(msg string, keysAndValues ...interface{}) {
	logger.Warnw(msg, keysAndValues...)
}

func Error(args ...interface{}) {
	logger.Error(args...)
}

func Errorf(template string, args ...interface{}) {
	logger.Errorf(template, args...)
}

func Errorw(msg string, keysAndValues ...interface{}) {
	logger.Errorw(msg, keysAndValues...)
}
