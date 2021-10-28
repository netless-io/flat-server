package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/pkg/utils"
	"gopkg.in/yaml.v3"
)

var (
	filePath string
)

func main() {
	flag.StringVar(&filePath, "conf.path", "./config.yaml", "configuration file path")
	flag.Parse()

	err := writeConfig(filePath)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

}

func writeConfig(filePath string) error {

	fileType, err := utils.FileExtension(filePath)
	if err != nil {
		return err
	}

	var (
		conf conf.FlatConf
		data []byte
	)
	switch fileType {

	case "yaml", "yml":
		data, err = yaml.Marshal(conf)
	case "json":
		data, err = json.Marshal(conf)
	default:
		return fmt.Errorf("unSupport config file type: %s", fileType)

	}

	if err != nil {
		return err
	}

	return os.WriteFile(filePath, data, 0666)
}
