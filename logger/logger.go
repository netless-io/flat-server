package logger

import (
	"os"

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

func New(conf *LogConfig) error {

	if conf == nil {
		conf = DefaultLogConf()
	}

	conf.atomicLevel = zap.NewAtomicLevel()

	return conf.applyLogConfig()
}

// apply
func (conf *LogConfig) applyLogConfig() error {

	var (
		cores   = []zapcore.Core{}
		encoder zapcore.Encoder
	)

	if conf.JsonFormat {
		encoder = zapcore.NewJSONEncoder(getEncoderConf())
	} else {
		encoder = zapcore.NewConsoleEncoder(getEncoderConf())
	}

	conf.atomicLevel.SetLevel(getLevel(conf.Level))

	if conf.Consoleout {
		writer := zapcore.Lock(os.Stdout)
		core := zapcore.NewCore(encoder, writer, conf.atomicLevel)
		cores = append(cores, core)
	}

	if conf.Fileout.Enable {
		fileWriter := storage.LocalFileWriter(
			conf.Fileout.Path,
			conf.Fileout.Name,
			conf.Fileout.RotationTime,
			conf.Fileout.RotationCount,
		)

		writer := zapcore.AddSync(fileWriter)
		core := zapcore.NewCore(encoder, writer, conf.atomicLevel)
		cores = append(cores, core)
	}

	combinedCore := zapcore.NewTee(cores...)

	zapLog := zap.New(combinedCore,
		zap.AddCallerSkip(conf.CallerSkip),
		zap.AddStacktrace(getLevel(conf.StacktraceLevel)),
		zap.AddCaller(),
	)

	logger = zapLog.Sugar()
	return logger.Sync()

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
