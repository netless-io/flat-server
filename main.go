package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/internal"
)

var (
	confFile string
)

func init() {
	flag.StringVar(&confFile, "conf.path", "", "flat configuration file path")
	flag.Parse()

	err := conf.ReadConf(confFile)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func main() {
	fmt.Println("hello flat-server")
	fmt.Printf("version: %s\n", internal.Version)
}
