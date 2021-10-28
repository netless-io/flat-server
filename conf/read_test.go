package conf

import (
	"encoding/json"
	"os"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestConvertToYaml(t *testing.T) {
	_ = os.Setenv("SERVER_PORT", "80")
	_ = os.Setenv("REDIS_DB", "8")

	err := Read("")
	if err != nil {
		t.Fatal(err)
	}
	data, err := yaml.Marshal(conf)
	if err != nil {
		t.Fatal(err)
		return
	}

	err = os.WriteFile("./testdata/.default.yaml", data, 0600)
	if err != nil {
		t.Fatal(err)
		return
	}
}

func TestConvertToJSON(t *testing.T) {
	_ = os.Setenv("SERVER_PORT", "80")
	_ = os.Setenv("REDIS_DB", "8")

	err := Read("")
	if err != nil {
		t.Fatal(err)
	}
	data, err := json.Marshal(conf)
	if err != nil {
		t.Fatal(err)
		return
	}

	err = os.WriteFile("./testdata/.default.json", data, 0600)
	if err != nil {
		t.Fatal(err)
		return
	}
}

// go test -v conf.go read_test.go read.go -run=TestReadFileInConf
func TestReadFileInConf(t *testing.T) {

	err := Read("./testdata/.default.yaml")
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ServerPort())
}

// go test -v conf.go read_test.go read.go -run=TestReadEnvInConf
func TestReadEnvInConf(t *testing.T) {
	_ = os.Setenv("SERVER_PORT", "80")
	_ = os.Setenv("REDIS_DB", "8")

	err := Read("")
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ServerPort())
	t.Logf("%+v\n", Redis())
}
