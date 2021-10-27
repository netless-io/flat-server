package conf

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/netless-io/flat-server/pkg/utils"
	"gopkg.in/yaml.v3"
)

const (
	defaultENV                       = "development"
	defaultStorageConcurrent         = 3
	defaultStorageSingleFileSize     = 500 * utils.MB
	defaultStorageTotalSize          = 2 * utils.GB
	defaultStoragePrefixPath         = "cloud-storage"
	defaultStorageAllowFileSuffix    = "ppt,pptx,doc,docx,pdf,png,jpg,jpeg,gif,mp3,mp4,ice"
	defaultStorageAllowUrlFileSuffix = "vf"
)

var conf *FlatConf

// StorageType support cloud storage type
var StorageType = []string{"oss"}

func ReadConf(confFilePath string) error {
	conf = new(FlatConf)

	if confFilePath == "" {
		confFilePath = os.Getenv("FLAT_CONFIG_PATH")
	}

	if confFilePath == "" {

		return readEnvInConf(conf)
	}

	return readFileInConf(conf, confFilePath)
}

func readEnvInConf(conf *FlatConf) error {
	var err error

	conf.ServerPort = os.Getenv("SERVER_PORT")
	conf.ENV = os.Getenv("ENV")
	if conf.ENV == "" {
		conf.ENV = defaultENV
	}

	conf.Redis.Host = os.Getenv("REDIS_HOST")
	conf.Redis.Port = os.Getenv("REDIS_PORT")
	conf.Redis.Username = os.Getenv("REDIS_USERNAME")
	conf.Redis.Password = os.Getenv("REDIS_PASSWORD")
	redisDB := os.Getenv("REDIS_DB")
	conf.Redis.Pool, err = strconv.Atoi(redisDB)
	if err != nil {
		return err
	}

	conf.MySQL.Host = os.Getenv("MYSQL_HOST")
	conf.MySQL.Port = os.Getenv("MYSQL_PORT")
	conf.MySQL.Username = os.Getenv("MYSQL_USER")
	conf.MySQL.Password = os.Getenv("MYSQL_PASSWORD")
	conf.MySQL.Name = os.Getenv("MYSQL_DB")

	conf.JWT.Secret = os.Getenv("JWT_SECRET")
	conf.JWT.Algorithms = os.Getenv("JWT_ALGORITHMS")

	conf.Log.FileName = os.Getenv("LOG_PATHNAME")
	conf.Log.Path = os.Getenv("LOG_FILENAME")

	onMetrics := os.Getenv("METRICS_ENABLED")
	on, err := strconv.ParseBool(onMetrics)
	if err == nil {
		conf.Metrics.Enable = on
	}

	conf.Metrics.Endpoint = os.Getenv("METRICS_ENDPOINT")
	conf.Metrics.Port = os.Getenv("METRICS_PORT")

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

	ossStorage := make(map[string]CloudStorageConf)
	oss := CloudStorageConf{
		AccessKey: os.Getenv("ALIBABA_CLOUD_OSS_ACCESS_KEY"),
		SecretKey: os.Getenv("ALIBABA_CLOUD_OSS_ACCESS_KEY_SECRET"),
		Endpoint:  os.Getenv("ALIBABA_CLOUD_OSS_ENDPOINT"),
		Region:    os.Getenv("ALIBABA_CLOUD_OSS_REGION"),
		Bucket:    os.Getenv("ALIBABA_CLOUD_OSS_BUCKET"),
	}
	ossStorage["oss"] = oss
	conf.Storage.Type = ossStorage

	conf.Storage.Concurrent = defaultStorageConcurrent
	concurrent := os.Getenv("CLOUD_STORAGE_CONCURRENT")

	if concurrentInt, err := strconv.Atoi(concurrent); err == nil && concurrentInt > 0 {
		conf.Storage.Concurrent = concurrentInt
	}

	conf.Storage.SingleFileSize = defaultStorageSingleFileSize
	singleFileSize := os.Getenv("CLOUD_STORAGE_SINGLE_FILE_SIZE")
	if singleFileSizeInt, err := strconv.Atoi(singleFileSize); err == nil && singleFileSizeInt > 0 {
		conf.Storage.Concurrent = singleFileSizeInt
	}

	conf.Storage.TotalSize = defaultStorageTotalSize
	totalSize := os.Getenv("CLOUD_STORAGE_TOTAL_SIZE")
	if totalSizeInt, err := strconv.Atoi(totalSize); err == nil && totalSizeInt > 0 {
		conf.Storage.Concurrent = totalSizeInt
	}

	conf.Storage.PrefixPath = defaultStoragePrefixPath
	if prefixPath := os.Getenv("CLOUD_STORAGE_PREFIX_PATH"); prefixPath != "" {
		conf.Storage.PrefixPath = prefixPath
	}

	conf.Storage.AllowFileSuffix = defaultStorageAllowFileSuffix
	if allowFileSuffix := os.Getenv("CLOUD_STORAGE_ALLOW_FILE_SUFFIX"); allowFileSuffix != "" {
		conf.Storage.AllowFileSuffix = allowFileSuffix
	}

	conf.Storage.AllowURLFileSuffix = defaultStorageAllowUrlFileSuffix
	if allowUrlFileSuffix := os.Getenv("CLOUD_STORAGE_ALLOW_URL_FILE_SUFFIX"); allowUrlFileSuffix != "" {
		conf.Storage.AllowURLFileSuffix = allowUrlFileSuffix
	}

	conf.Whiteboard.AccessKey = os.Getenv("NETLESS_ACCESS_KEY")
	conf.Whiteboard.Secretkey = os.Getenv("NETLESS_SECRET_ACCESS_KEY")
	return nil
}

func readFileInConf(conf *FlatConf, filePath string) error {
	fileData, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	suffixIndex := strings.LastIndex(filePath, ".")
	if suffixIndex < 0 {
		return fmt.Errorf("unsupport config file type: %s", filePath)
	}

	fileType := filePath[suffixIndex+1:]

	fileType = strings.ToLower(fileType)

	switch fileType {

	case "yaml", "yml":
		err = yaml.Unmarshal(fileData, conf)
	case "json":
		err = json.Unmarshal(fileData, conf)
	default:
		return fmt.Errorf("unsupport config file type: %s", fileType)

	}

	if err != nil {
		return err
	}

	if conf.Storage.Concurrent <= 0 {
		conf.Storage.Concurrent = defaultStorageConcurrent
	}

	if conf.Storage.SingleFileSize <= 0 {
		conf.Storage.SingleFileSize = defaultStorageSingleFileSize
	}

	if conf.Storage.TotalSize <= 0 {
		conf.Storage.TotalSize = defaultStorageTotalSize
	}

	if conf.Storage.PrefixPath == "" {
		conf.Storage.PrefixPath = defaultStoragePrefixPath
	}

	if conf.Storage.AllowFileSuffix == "" {
		conf.Storage.AllowFileSuffix = defaultStorageAllowFileSuffix
	}

	if conf.Storage.AllowURLFileSuffix == "" {
		conf.Storage.AllowURLFileSuffix = defaultStorageAllowUrlFileSuffix
	}

	return nil

}

func ServerPort() string {
	return conf.ServerPort
}
func RunMod() string {
	return conf.ENV
}

// compatibility old node.js version
func IsTest() bool {
	return os.Getenv("IS_TEST") == "yes"
}

// compatibility old node.js version
func IsDev() bool {
	return conf.ENV == defaultENV
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

func NetLess() Whiteboard {
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
