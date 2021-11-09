package conf

import (
	"encoding/json"
	"fmt"
	"github.com/netless-io/flat-server/pkg/utils"
	"gopkg.in/yaml.v3"
	"log"
	"os"
	"strconv"
)

var conf *FlatConf

func Read(confFilePath string) error {
	conf = new(FlatConf)

	if confFilePath == "" {
		confFilePath = os.Getenv("FLAT_CONFIG_PATH")
	}

	var err error
	if confFilePath == "" {
		err = readEnvInConf(conf)
	} else {
		err = readFileInConf(conf, confFilePath)
	}

	if err != nil {
		return err
	}

	SafeSetDefault(conf)
	return nil
}

func readEnvInConf(conf *FlatConf) error {
	conf.ServerPort = assertStrToIntByEnv("SERVER_PORT")

	conf.Redis.Host = os.Getenv("REDIS_HOST")
	conf.Redis.Port = assertStrToIntByEnv("REDIS_PORT")
	conf.Redis.Username = os.Getenv("REDIS_USERNAME")
	conf.Redis.Password = os.Getenv("REDIS_PASSWORD")
	conf.Redis.Pool = assertStrToIntByEnv("REDIS_DB")

	conf.MySQL.Host = os.Getenv("MYSQL_HOST")
	conf.MySQL.Port = assertStrToIntByEnv("MYSQL_PORT")
	conf.MySQL.Username = os.Getenv("MYSQL_USER")
	conf.MySQL.Password = os.Getenv("MYSQL_PASSWORD")
	conf.MySQL.Name = os.Getenv("MYSQL_DB")

	conf.JWT.Secret = os.Getenv("JWT_SECRET")
	conf.JWT.Algorithms = os.Getenv("JWT_ALGORITHMS")

	conf.Log.LocalFile.FileName = os.Getenv("LOG_PATHNAME")
	conf.Log.LocalFile.Path = os.Getenv("LOG_FILENAME")

	conf.Metrics.Enable, _ = strconv.ParseBool(os.Getenv("METRICS_ENABLED"))

	conf.Metrics.Endpoint = os.Getenv("METRICS_ENDPOINT")
	conf.Metrics.Port = assertStrToIntByEnv("METRICS_PORT")

	conf.OAuth.WeChat.Web.AccessKeyID = os.Getenv("WEB_WECHAT_APP_ID")
	conf.OAuth.WeChat.Web.SecretKey = os.Getenv("WEB_WECHAT_APP_SECRET")
	conf.OAuth.WeChat.Mobile.AccessKeyID = os.Getenv("MOBILE_WECHAT_APP_ID")
	conf.OAuth.WeChat.Mobile.SecretKey = os.Getenv("MOBILE_WECHAT_APP_SECRET")

	conf.OAuth.Github.APPID = os.Getenv("GITHUB_CLIENT_ID")
	conf.OAuth.Github.SecretKey = os.Getenv("GITHUB_CLIENT_SECRET")

	conf.Agora.APPID = os.Getenv("AGORA_APP_ID")
	conf.Agora.Certificate = os.Getenv("AGORA_APP_CERTIFICATE")
	conf.Agora.RestfulID = os.Getenv("AGORA_RESTFUL_ID")
	conf.Agora.RestfulSecret = os.Getenv("AGORA_RESTFUL_SECRET")

	conf.Agora.OSS.Vendor = os.Getenv("AGORA_OSS_VENDOR")
	conf.Agora.OSS.AccessKey = os.Getenv("AGORA_OSS_ACCESS_KEY_ID")
	conf.Agora.OSS.SecretKey = os.Getenv("AGORA_OSS_ACCESS_KEY_SECRET")
	conf.Agora.OSS.Region = os.Getenv("AGORA_OSS_REGION")
	conf.Agora.OSS.Bucket = os.Getenv("AGORA_OSS_BUCKET")
	conf.Agora.OSS.Folder = os.Getenv("AGORA_OSS_FOLDER")
	conf.Agora.OSS.Prefix = os.Getenv("AGORA_OSS_PREFIX")

	conf.Storage.Type = CloudStorageTypeConf{
		OSS: CloudStorageOSSConf{
			AccessKey: os.Getenv("CLOUD_STORAGE_OSS_ACCESS_KEY"),
			SecretKey: os.Getenv("CLOUD_STORAGE_OSS_ACCESS_KEY_SECRET"),
			Endpoint:  os.Getenv("CLOUD_STORAGE_OSS_ENDPOINT"),
			Region:    os.Getenv("CLOUD_STORAGE_OSS_REGION"),
			Bucket:    os.Getenv("CLOUD_STORAGE_OSS_BUCKET"),
		},
	}
	conf.Storage.Concurrent = assertStrToIntByEnv("CLOUD_STORAGE_CONCURRENT")
	conf.Storage.SingleFileSize = assertStrToIntByEnv("CLOUD_STORAGE_SINGLE_FILE_SIZE")
	conf.Storage.TotalSize = assertStrToIntByEnv("CLOUD_STORAGE_TOTAL_SIZE")
	conf.Storage.PrefixPath = os.Getenv("CLOUD_STORAGE_PREFIX_PATH")
	conf.Storage.AllowFileSuffix = os.Getenv("CLOUD_STORAGE_ALLOW_FILE_SUFFIX")
	conf.Storage.AllowURLFileSuffix = os.Getenv("CLOUD_STORAGE_ALLOW_URL_FILE_SUFFIX")

	conf.Whiteboard.AccessKey = os.Getenv("WHITEBOARD_ACCESS_KEY")
	conf.Whiteboard.SecretKey = os.Getenv("WHITEBOARD_SECRET_ACCESS_KEY")

	return nil
}

func readFileInConf(conf *FlatConf, filePath string) error {
	fileData, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	fileType, err := utils.FileExtension(filePath)
	if err != nil {
		return err
	}

	switch fileType {

	case "yaml", "yml":
		err = yaml.Unmarshal(fileData, conf)
	case "json":
		err = json.Unmarshal(fileData, conf)
	default:
		return fmt.Errorf("unsupport config file type: %s", fileType)
	}

	return err
}

func ServerPort() int {
	return conf.ServerPort
}

func Redis() RedisConf {
	return conf.Redis
}

func Mysql() MySQLConf {
	return conf.MySQL
}

func WeChat() WeChatOAuth {
	return conf.OAuth.WeChat
}

func GitHub() GithubOAuth {
	return conf.OAuth.Github
}

func Agora() AgoraConf {
	return conf.Agora
}

func JWT() JWTConf {
	return conf.JWT
}

func NetLess() WhiteboardConf {
	return conf.Whiteboard
}

func CloudStorage() StorageConf {
	return conf.Storage
}

func AlibabaCloud() StorageConf {
	return conf.Storage
}

func LogConfig() LoggerConf {
	return conf.Log
}

func MetricsConfig() MetricsConf {
	return conf.Metrics
}

func assertStrToIntByEnv(env string) int {
	str := os.Getenv(env)
	value, err := strconv.Atoi(env)

	if err != nil {
		log.Fatalf("conversion string to int failed. env %s, value: %s, error: %s", env, str, err)
	}

	return value
}
