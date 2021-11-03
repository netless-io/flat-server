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
