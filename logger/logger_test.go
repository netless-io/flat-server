package logger

import (
	"testing"

	"github.com/netless-io/flat-server/conf"
	"go.uber.org/zap"
)

func TestLog(t *testing.T) {
	conf := conf.LoggerConf{}
	conf.Level = "debug"
	conf.StackTraceLevel = "warn"
	conf.File.Name = "test"
	conf.File.Path = "./testdata"

	err := New(conf)
	if err != nil {
		t.Fatal(err)
	}

	Debug("Debug")
	Debugf("%s", "Debuf")
	Info("Info")
	Infof("%s", "Infof")

	userData := make(map[string][]string)
	userData["/v1"] = []string{"a", "b"}

	payLoad := struct {
		Path string              `json:"path"`
		User map[string][]string `json:"user"`
	}{
		Path: "/v1/flat",
		User: userData,
	}
	Infow("this a message", zap.Any("payload", payLoad))
	Warn("Warn")
	Warnf("%s", "Warnf")
	Error("Error")
	Errorf("%s", "Errorf")
}
