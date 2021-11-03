package logger

import (
	"testing"

	"go.uber.org/zap"
)

func TestLog(t *testing.T) {
	conf := DefaultLogConf()
	conf.Level = "debug"
	conf.StacktraceLevel = "warn"
	conf.Fileout.Enable = true
	conf.Fileout.Name = "test"
	conf.Fileout.Path = "./testdata"

	New(conf)
	logger.Debug("Debug")
	logger.Debugf("%s", "Debuf")
	logger.Info("Info")
	logger.Infof("%s", "Infof")

	userData := make(map[string][]string)
	userData["/v1"] = []string{"a", "b"}

	payLoad := struct {
		Path string              `json:"path"`
		User map[string][]string `json:"user"`
	}{
		Path: "/v1/flat",
		User: userData,
	}
	logger.Infow("this a message", zap.Any("payload", payLoad))
	logger.Warn("Warn")
	logger.Warnf("%s", "Warnf")
	logger.Error("Error")
	logger.Errorf("%s", "Errorf")
}
