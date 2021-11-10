package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type LogConfig struct {
	Level           string
	StackTraceLevel string
	atomicLevel     zap.AtomicLevel
	CallerSkip      int
	JsonFormat      bool
	Console         bool
	File            File
}

type File struct {
	Enable        bool
	Path          string
	Name          string
	RotationTime  uint // log cutting interval (hours)
	RotationCount uint // max number of log files to be save
}

// defaultLogConf provides a default logging configuration for quick use
func defaultLogConf() *LogConfig {
	return &LogConfig{
		Level:           "info",
		StackTraceLevel: "error",
		CallerSkip:      1,
		JsonFormat:      true,
		Console:         true,
		File: File{
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
