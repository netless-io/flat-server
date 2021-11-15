package redis

import (
	"context"
	"fmt"

	"github.com/netless-io/flat-server/conf"

	"github.com/go-redis/redis/v8"
)

var redisClient *redis.Client

func OpenConn(conf conf.RedisConf) error {
	addr := fmt.Sprintf("%s:%v", conf.Host, conf.Port)
	redisClient = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: conf.Password,
		DB:       conf.Pool,
	})

	// testing conn
	return redisClient.Ping(context.Background()).Err()
}
