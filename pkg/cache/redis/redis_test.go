package redis

import (
	"strings"
	"testing"

	"github.com/netless-io/flat-server/conf"
)

func init() {
	c := conf.RedisConf{
		Host: "127.0.0.1",
		Port: 6379,
		Pool: 0,
	}
	err := OpenConn(c)
	if err != nil {
		panic(err)
	}
}

func TestScan(t *testing.T) {
	res, err := Scan("agora:rtm:userUUID*", 100)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(strings.Join(res, "\n"))
}

func TestVacantKey(t *testing.T) {
	k := []string{"room:invite:123123", "room:invite:123123-null", "agora:rtc:room:uuid:uid:123123", "agora:rtc:room:uuid:uid:123123-null"}
	res, err := VacantKey(k...)
	if err != nil {
		t.Fatal(err)
	}

	t.Log(strings.Join(res, "\n"))
}
