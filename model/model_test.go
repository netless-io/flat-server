package model

import (
	"testing"

	"github.com/netless-io/flat-server/conf"
)

func init() {
	err := conf.Read("../config/.default.yaml")
	if err != nil {
		panic(err)
	}

	err = OpenDBConn(conf.Mysql())
	if err != nil {
		panic(err)
	}

}

func TestSelectUserLimit(t *testing.T) {
	var users []Users
	err := dbClient.Find(&users).Limit(10).Offset(1).Error
	if err != nil {
		t.Fatal(err)
	}

	for _, v := range users {
		t.Logf("%+v\n", v)

	}
}
