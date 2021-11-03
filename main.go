package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/netless-io/flat-server/api"
	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/internal"
	"github.com/netless-io/flat-server/logger"
)

func init() {
	var confFile string
	flag.StringVar(&confFile, "conf.path", "", "flat configuration file path")
	flag.Parse()

	err := conf.Read(confFile)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func main() {
	fmt.Println("hello flat-server")
	fmt.Printf("environment: %s, version: %s\n", internal.ENV, internal.Version)

	logConf := logger.DefaultLogConf()
	logger.New(logConf)

	route := api.InitRoute()

	if err := route.Run(":80"); err != nil {
		log.Fatal(err)
	}
}
