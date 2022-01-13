package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/netless-io/flat-server/conf"

	"github.com/go-redis/redis/v8"
)

var redisClient *redis.Client

func OpenConn(conf conf.RedisConf) error {
	addr := fmt.Sprintf("%s:%v", conf.Host, conf.Port)
	redisClient = redis.NewClient(&redis.Options{
		Addr:     addr,
		Username: conf.Username,
		Password: conf.Password,
		DB:       conf.Pool,
	})

	// testing conn
	return redisClient.Ping(context.TODO()).Err()
}

func Set(ctx context.Context, key, value string, expire time.Duration) error {
	if expire <= 0 {
		expire = -1
	}

	return redisClient.Set(ctx, key, value, expire).Err()
}

func Get(ctx context.Context, key string) (string, error) {
	return redisClient.Get(ctx, key).Result()
}

func Del(ctx context.Context, keys ...string) error {
	return redisClient.Del(ctx, keys...).Err()
}

func HMSet(ctx context.Context, key string, value map[string]string, expire time.Duration) error {
	if expire <= 0 {
		expire = -1
	}

	err := redisClient.HMSet(ctx, key, value).Err()
	if err != nil {
		return err
	}

	return redisClient.Expire(ctx, key, expire).Err()
}

func HMGetWithField(ctx context.Context, key string, field ...string) (interface{}, error) {
	return redisClient.HMGet(ctx, key, field...).Result()
}

func MGet(ctx context.Context, keys ...string) (interface{}, error) {
	return redisClient.MGet(ctx, keys...).Result()
}

func Scan(ctx context.Context, match string, count int64) ([]string, error) {

	result := make([]string, 0)

	iter := redisClient.Scan(ctx, 0, match, count).Iterator()
	for iter.Next(ctx) {
		strRes := redisClient.Get(ctx, iter.Val())
		if err := strRes.Err(); err != nil {
			return nil, err
		}
		result = append(result, strRes.Val())
	}

	return result, nil
}

func VacantKey(ctx context.Context, keys ...string) ([]string, error) {
	sliceCmd := redisClient.MGet(ctx, keys...)
	if err := sliceCmd.Err(); err != nil {
		if err == redis.Nil {
			return keys, nil
		}

		return nil, err
	}

	values := sliceCmd.Val()
	result := make([]string, 0)
	for i := 0; i < len(values); i++ {
		value := values[i]

		if value == nil {
			result = append(result, keys[i])
		}
	}

	return result, nil
}
