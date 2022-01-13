package main

import (
	_ "embed"
	"flag"
	"fmt"
	"log"
	"strconv"

	"github.com/netless-io/flat-server/api"
	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/dao"
	"github.com/netless-io/flat-server/internal"
	"github.com/netless-io/flat-server/logger"
)

//go:embed VERSION
var Version string

func init() {
	var confFile string
	flag.StringVar(&confFile, "conf.path", "", "flat configuration file path")
	flag.Parse()

	err := conf.Read(confFile)
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	fmt.Printf("environment: %s, version: %s\n", internal.ENV, Version)

	if err := logger.Init(conf.LogConfig()); err != nil {
		log.Fatal(err)
	}

	err := dao.RegistryModel(conf.Mysql())
	if err != nil {
		logger.Error(err)
		return
	}

	app := api.New(internal.ENV)

	port := strconv.Itoa(conf.ServerPort())

	logger.Infof("listening and serving HTTP on :%s", port)

	if err := app.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
