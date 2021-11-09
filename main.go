package main

import (
	_ "embed"
	"flag"
	"fmt"
	"github.com/netless-io/flat-server/api"
	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/internal"
	"github.com/netless-io/flat-server/logger"
	"log"
	"strconv"
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

	logConf := logger.DefaultLogConf()

	if err := logger.New(logConf); err != nil {
		log.Fatal(err)
	}

	app := api.New(internal.ENV)

	port := strconv.Itoa(conf.ServerPort())

	if err := app.Run(":" + port); err != nil {
		log.Fatal(err)
	} else {
		logger.Infof("listening and serving HTTP on :%s", port)
	}
}
