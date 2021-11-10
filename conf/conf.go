package conf

type FlatConf struct {
	ServerPort int            `json:"serverPort" yaml:"serverPort"`
	MySQL      MySQLConf      `json:"mysql" yaml:"mysql"`
	Redis      RedisConf      `json:"redis" yaml:"redis"`
	JWT        JWTConf        `json:"jwt" yaml:"jwt"`
	OAuth      OAuth          `json:"oauth" yaml:"oauth"`
	Log        LoggerConf     `json:"log,omitempty" yaml:"log,omitempty"`
	Metrics    MetricsConf    `json:"metrics" yaml:"metrics"`
	Agora      AgoraConf      `json:"agora" yaml:"agora"`
	Storage    StorageConf    `json:"storage" yaml:"storage"`
	Whiteboard WhiteboardConf `json:"whiteboard" yaml:"whiteboard"`
}

type MySQLConf struct {
	Host            string `json:"host" yaml:"host"`
	Port            int    `json:"port" yaml:"port"`
	Username        string `json:"username" yaml:"username"`
	Password        string `json:"password" yaml:"password"`
	Name            string `json:"name" yaml:"name"`
	ConnMaxLifetime int    `json:"connMaxLifetime,omitempty" yaml:"connMaxLifetime,omitempty"`
	MaxOpenConns    int    `json:"maxOpenConns,omitempty" yaml:"maxOpenConns,omitempty"`
	MaxIdleConns    int    `json:"maxIdleConns,omitempty" yaml:"maxIdleConns,omitempty"`
}

type RedisConf struct {
	Host     string `json:"host" yaml:"host"`
	Port     int    `json:"port" yaml:"port"`
	Username string `json:"username" yaml:"username"`
	Password string `json:"password" yaml:"password"`
	Pool     int    `json:"pool" yaml:"pool"`
}

type JWTConf struct {
	Secret     string `json:"secret" yaml:"secret"`
	Algorithms string `json:"algorithms" yaml:"algorithms"`
}

type LoggerConf struct {
	Level           string         `json:"level,omitempty" yaml:"level,omitempty"`
	StackTraceLevel string         `json:"stackTraceLevel,omitempty" yaml:"stackTraceLevel,omitempty"`
	DisableConsole  bool           `json:"disableConsole,omitempty" yaml:"disableConsole,omitempty"`
	File            LoggerFileConf `json:"file,omitempty" yaml:"file,omitempty"`
}

type LoggerFileConf struct {
	Path          string `json:"path" yaml:"path"`
	Name          string `json:"name" yaml:"name"`
	RotationTime  uint   `json:"rotationTime" yaml:"rotationTime"`
	RotationCount uint   `json:"rotationCount" yaml:"rotationCount"`
}

type OAuth struct {
	WeChat WeChatOAuth `json:"weChat" yaml:"weChat"`
	Github GithubOAuth `json:"github" yaml:"github"`
}
type WeChatOAuth struct {
	Web    WeChatWebOAuth    `json:"web" yaml:"web"`
	Mobile WeChatMobileOAuth `json:"mobile" yaml:"mobile"`
}
type WeChatWebOAuth struct {
	AccessKeyID string `json:"accessKeyId" yaml:"accessKeyId"`
	SecretKey   string `json:"secretKey" yaml:"secretKey"`
}
type WeChatMobileOAuth struct {
	AccessKeyID string `json:"accessKeyId" yaml:"accessKeyId"`
	SecretKey   string `json:"secretKey" yaml:"secretKey"`
}

type GithubOAuth struct {
	APPID     string `json:"appId" yaml:"appId"`
	SecretKey string `json:"secretKey" yaml:"secretKey"`
}

type MetricsConf struct {
	Enable   bool   `json:"enable" yaml:"enable"`
	Endpoint string `json:"endpoint" yaml:"endpoint"`
	Port     int    `json:"port" yaml:"port"`
}

type AgoraConf struct {
	APPID         string       `json:"appId" yaml:"appId"`
	Certificate   string       `json:"certificate" yaml:"certificate"`
	RestfulID     string       `json:"restfulId" yaml:"restfulId"`
	RestfulSecret string       `json:"restfulSecret" yaml:"restfulSecret"`
	OSS           AgoraOSSConf `json:"oss" yaml:"oss"`
}

type AgoraOSSConf struct {
	Vendor    string `json:"vendor" yaml:"vendor"`
	AccessKey string `json:"accessKey" yaml:"accessKey"`
	SecretKey string `json:"secretKey" yaml:"secretKey"`
	Region    string `json:"region" yaml:"region"`
	Bucket    string `json:"bucket" yaml:"bucket"`
	Folder    string `json:"folder" yaml:"folder"`
	Prefix    string `json:"prefix" yaml:"prefix"`
}

type StorageConf struct {
	Concurrent         int                  `json:"concurrent,omitempty" yaml:"concurrent,omitempty"`
	SingleFileSize     int                  `json:"singleFileSize,omitempty" yaml:"singleFileSize,omitempty"`
	TotalSize          int                  `json:"totalSize,omitempty" yaml:"totalSize,omitempty"`
	PrefixPath         string               `json:"prefixPath,omitempty" yaml:"prefixPath,omitempty"`
	AllowFileSuffix    string               `json:"allowFileSuffix,omitempty" yaml:"allowFileSuffix,omitempty"`
	AllowURLFileSuffix string               `json:"allowURlFileSuffix,omitempty" yaml:"allowURlFileSuffix,omitempty"`
	Type               CloudStorageTypeConf `json:"type" yaml:"type"`
}

type CloudStorageTypeConf struct {
	OSS CloudStorageOSSConf `json:"oss" yaml:"oss"`
}

type CloudStorageOSSConf struct {
	AccessKey string `json:"accessKey" yaml:"accessKey"`
	SecretKey string `json:"secretKey" yaml:"secretKey"`
	Endpoint  string `json:"endpoint" yaml:"endpoint"`
	Bucket    string `json:"bucket" yaml:"bucket"`
	Region    string `json:"region" yaml:"region"`
}

type WhiteboardConf struct {
	AccessKey string `json:"accessKey" yaml:"accessKey"`
	SecretKey string `json:"secretKey" yaml:"secretKey"`
}
