package logger

import (
	"testing"

	"go.uber.org/zap"
)

func TestLog(t *testing.T) {
	conf := DefaultLogConf()
	conf.Label = "test"
	conf.Level = "debug"
	conf.StacktraceLevel = "warn"
	// conf.Fileout.Enable = true
	// conf.Fileout.Name = "falt-test"
	// conf.Fileout.Path = "~/Downloads/flat-log"

	wlog := New(conf)
	wlog.Debug("Debug")
	wlog.Debugf("%s", "Debuf")
	wlog.Info("Info")
	wlog.Infof("%s", "Infof")

	userData := make(map[string][]string)
	userData["/v1"] = []string{"a", "b"}

	payLoad := struct {
		Path string              `json:"path"`
		User map[string][]string `json:"user"`
	}{
		Path: "/v1/flat",
		User: userData,
	}
	wlog.Infow("this a message", zap.Any("payload", payLoad))
	wlog.Warn("Warn")
	wlog.Warnf("%s", "Warnf")
	wlog.Error("Error")
	wlog.Errorf("%s", "Errorf")
}
