package model

import (
	"testing"

	"github.com/netless-io/flat-server/conf"
	"gorm.io/gorm"
)

var (
	dbConn *gorm.DB
)

func init() {
	err := conf.Read("../config/.default.yaml")
	if err != nil {
		panic(err)
	}

	dbConn, err = OpenDBConn(conf.Mysql())
	if err != nil {
		panic(err)
	}

}

func TestSelectUserLimit(t *testing.T) {
	var users []Users
	err := dbConn.Find(&users).Limit(10).Offset(1).Error
	if err != nil {
		t.Fatal(err)
	}

	for _, v := range users {
		t.Logf("%+v\n", v)

	}
}
