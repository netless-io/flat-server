package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type LogConfig struct {
	Level           string
	StacktraceLevel string
	atomicLevel     zap.AtomicLevel
	CallerSkip      int
	JsonFormat      bool
	Consoleout      bool
	Fileout         *Fileout
}

type Fileout struct {
	Enable        bool
	Path          string
	Name          string
	RotationTime  uint // log cutting interval (hours)
	RotationCount uint // max number of log files to be save
}

// DefaultLogConf provides a default logging configuration for quick use
func DefaultLogConf() *LogConfig {
	return &LogConfig{
		Level:           "info",
		StacktraceLevel: "error",
		CallerSkip:      1,
		JsonFormat:      true,
		Consoleout:      true,
		Fileout: &Fileout{
			Enable:        false,
			Path:          "",
			Name:          "",
			RotationTime:  24,
			RotationCount: 7,
		},
	}
}

func getLevel(level string) zapcore.Level {
	switch level {
	case "debug":
		return zap.DebugLevel
	case "info":
		return zap.InfoLevel
	case "warn":
		return zap.WarnLevel
	case "error":
		return zap.ErrorLevel
	case "fatal":
		return zap.FatalLevel
	default:
		return zap.InfoLevel
	}
}

func getEncoderConf() zapcore.EncoderConfig {
	return zapcore.EncoderConfig{
		LevelKey:       "level",
		TimeKey:        "time",
		MessageKey:     "message",
		CallerKey:      "caller",
		StacktraceKey:  "stacktrace",
		FunctionKey:    zapcore.OmitKey,
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
}
