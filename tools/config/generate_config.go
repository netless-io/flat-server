package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/pkg/utils"
	"gopkg.in/yaml.v3"
)

// Generate configuration files with golang type definitions
func main() {
	var configPaths = [...]string{"./config/.default.json", "./config/.default.yaml"}

	for _, p := range configPaths {
		err := writeConfig(p)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	}
}

func writeConfig(filePath string) error {
	fileType, err := utils.FileExtension(filePath)
	if err != nil {
		return err
	}

	var (
		flatConf conf.FlatConf
		data     []byte
	)

	conf.SafeSetDefault(&flatConf)

	switch fileType {
	case "yaml", "yml":
		data, err = yaml.Marshal(flatConf)
	case "json":
		data, err = json.MarshalIndent(flatConf, "", "    ")
	default:
		return fmt.Errorf("unsupport config file type: %s", fileType)
	}

	if err != nil {
		return err
	}

	return os.WriteFile(filePath, data, 0666)
}
