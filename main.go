package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/netless-io/flat-server/conf"
	"github.com/netless-io/flat-server/internal"
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
}
