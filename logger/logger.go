package logger

import (
	"os"
	"path/filepath"

	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/logger/storage"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var hostname, _ = os.Hostname()

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

func Init(loggerConf conf.LoggerConf) error {
	c, err := createLogConf(loggerConf)
	if err != nil {
		return err
	}

	c.applyLogConfig()

	return nil
}

func createLogConf(loggerConf conf.LoggerConf) (*LogConfig, error) {
	config := new(LogConfig)
	defaultConf := defaultLogConf()

	defer func() {
		config.atomicLevel = zap.NewAtomicLevel()
	}()

	// level filepath is null indicates that the log configuration is not specified
	if loggerConf.Level == "" && loggerConf.File.Path == "" {
		config = defaultConf
		return config, nil
	}

	config.CallerSkip = defaultConf.CallerSkip
	config.JsonFormat = defaultConf.JsonFormat

	if config.Level = loggerConf.Level; config.Level == "" {
		config.Level = defaultConf.Level
	}

	if config.StackTraceLevel = loggerConf.StackTraceLevel; config.StackTraceLevel == "" {
		config.StackTraceLevel = defaultConf.StackTraceLevel
	}

	if loggerConf.File.Path != "" {
		config.File.Enable = true
		logFilePath, err := filepath.Abs(loggerConf.File.Path)
		if err != nil {
			return nil, err
		}

		config.File.Path = logFilePath
		config.File.Name = loggerConf.File.Name

		if config.File.RotationCount = loggerConf.File.RotationCount; config.File.RotationCount <= 0 {
			config.File.RotationCount = defaultConf.File.RotationCount
		}

		if config.File.RotationTime = loggerConf.File.RotationTime; config.File.RotationTime <= 0 {
			config.File.RotationTime = defaultConf.File.RotationTime
		}

	}

	if !loggerConf.DisableConsole {
		config.Console = defaultConf.Console
	}

	return config, nil
}

func (conf *LogConfig) applyLogConfig() {

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

	logger = zapLog.Sugar().Named(hostname)

	// this error needs to be ignored
	logger.Sync()

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
