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
	Label           string
}

type Fileout struct {
	Enable        bool
	Path          string
	Name          string
	RotationTime  uint // log cutting interval (hours)
	RotationCount uint // max number of log files to be save
}

// DefaultLogConf provides a default logging configuration for quick use
// TODO this may not necessarily work
func DefaultLogConf() *LogConfig {
	return &LogConfig{
		Level:           "info",
		StacktraceLevel: "panic",
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
		NameKey:        "label",
		CallerKey:      "caller",
		StacktraceKey:  "stack",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
}
