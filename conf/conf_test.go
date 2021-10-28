package conf

import (
	"encoding/json"
	"os"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestConvertToYaml(t *testing.T) {
	os.Setenv("SERVER_PORT", "80")
	os.Setenv("REDIS_DB", "8")

	err := ReadConf("")
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
	os.Setenv("SERVER_PORT", "80")
	os.Setenv("REDIS_DB", "8")

	err := ReadConf("")
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

// go test -v conf.go conf_test.go process.go -run=TestReadFileInConf
func TestReadFileInConf(t *testing.T) {

	err := ReadConf("./testdata/.default.yaml")
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ServerPort())
	t.Log(RunMod())
	t.Log(IsDev())
	t.Log(IsTest())
}

// go test -v conf.go conf_test.go process.go -run=TestReadEnvInConf
func TestReadEnvInConf(t *testing.T) {
	os.Setenv("SERVER_PORT", "80")
	os.Setenv("REDIS_DB", "8")

	err := ReadConf("")
	if err != nil {
		t.Fatal(err)
	}
	t.Log(ServerPort())
	t.Log(RunMod())
	t.Log(IsDev())
	t.Log(IsTest())
	t.Logf("%+v\n", Redis())
}
