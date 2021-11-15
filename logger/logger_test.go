package logger

import (
	"testing"

	"github.com/netless-io/flat-server/conf"
	"go.uber.org/zap"
)

func TestLog(t *testing.T) {
	config := conf.LoggerConf{}
	config.Level = "debug"
	config.StackTraceLevel = "warn"
	config.File.Name = "test"
	config.File.Path = "./testdata"

	err := Init(config)
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
