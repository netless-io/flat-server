package logger

import (
	"os"

	"github.com/netless-io/flat-server/logger/storage"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Logger interface {
	Debug(args ...interface{})

	Debugf(template string, args ...interface{})

	Debugw(msg string, keysAndValues ...interface{})

	Info(args ...interface{})

	Infof(template string, args ...interface{})

	Infow(msg string, keysAndValues ...interface{})

	Warn(args ...interface{})

	Warnf(template string, args ...interface{})

	Warnw(msg string, keysAndValues ...interface{})

	Error(args ...interface{})

	Errorf(template string, args ...interface{})

	Errorw(msg string, keysAndValues ...interface{})

	Fatal(args ...interface{})

	Fatalf(template string, args ...interface{})

	Fatalw(msg string, keysAndValues ...interface{})
}

type LogType struct {
	conf   *LogConfig
	logger *zap.SugaredLogger
}

func New(conf *LogConfig) Logger {
	logger := new(LogType)

	if conf == nil {
		logger.conf = DefaultLogConf()
	} else {
		logger.conf = conf
	}

	logger.conf.atomicLevel = zap.NewAtomicLevel()

	logger.applyLogConfig()
	return logger
}

// apply
func (l *LogType) applyLogConfig() {

	var (
		conf    = l.conf
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

	logger := zap.New(combinedCore,
		zap.AddCallerSkip(conf.CallerSkip),
		zap.AddStacktrace(getLevel(conf.StacktraceLevel)),
		zap.AddCaller(),
	)

	l.logger = logger.Sugar()
	logger.Sync()

}

func (l *LogType) Debug(args ...interface{}) {
	l.logger.Debug(args...)
}

func (l *LogType) Debugf(template string, args ...interface{}) {
	l.logger.Debugf(template, args...)
}

func (l *LogType) Debugw(template string, keysAndValues ...interface{}) {
	l.logger.Debugw(template, keysAndValues...)
}

func (l *LogType) Info(args ...interface{}) {
	l.logger.Info(args...)
}

func (l *LogType) Infof(template string, args ...interface{}) {
	l.logger.Infof(template, args...)
}

func (l *LogType) Infow(template string, keysAndValues ...interface{}) {
	l.logger.Infow(template, keysAndValues...)
}

func (l *LogType) Warn(args ...interface{}) {
	l.logger.Warn(args...)
}

func (l *LogType) Warnf(template string, args ...interface{}) {
	l.logger.Warnf(template, args...)
}

func (l *LogType) Warnw(template string, keysAndValues ...interface{}) {
	l.logger.Warnf(template, keysAndValues...)
}

func (l *LogType) Error(args ...interface{}) {
	l.logger.Error(args...)
}

func (l *LogType) Errorf(template string, args ...interface{}) {
	l.logger.Errorf(template, args...)
}

func (l *LogType) Errorw(template string, keysAndValues ...interface{}) {
	l.logger.Errorw(template, keysAndValues...)
}

func (l *LogType) Fatal(args ...interface{}) {
	l.logger.Fatal(args...)
}

func (l *LogType) Fatalf(template string, args ...interface{}) {
	l.logger.Fatalf(template, args...)
}

func (l *LogType) Fatalw(template string, keysAndValues ...interface{}) {
	l.logger.Fatalw(template, keysAndValues...)
}
