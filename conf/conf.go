package conf

type FlatConf struct {
	ServerPort string      `json:"serverPort" yaml:"serverPort"`
	ENV        string      `json:"env" yaml:"env"`
	MySQL      MySQLConf   `json:"mysql" yaml:"mysql"`
	Redis      RedisConf   `json:"redis" yaml:"redis"`
	JWT        JWTConf     `json:"jwt" yaml:"jwt"`
	OAuth      OAuth       `json:"oauth" yaml:"oauth"`
	Log        LoggerConf  `json:"log" yaml:"log"`
	Metrics    MetricsConf `json:"metrics" yaml:"metrics"`
	Agora      AgoraConf   `json:"agora" yaml:"agora"`
	Storage    StorageConf `json:"storage" yaml:"storage"`
	Whiteboard Whiteboard  `json:"whiteboard" yaml:"whiteboard"`
}

type MySQLConf struct {
	Host     string `json:"host" yaml:"host"`
	Port     string `json:"port" yaml:"port"`
	Username string `json:"username" yaml:"username"`
	Password string `json:"password" yaml:"password"`
	Name     string `json:"name" yaml:"name"`
}

type RedisConf struct {
	Host     string `json:"host" yaml:"host"`
	Port     string `json:"port" yaml:"port"`
	Username string `json:"username" yaml:"username"`
	Password string `json:"password" yaml:"password"`
	Pool     int    `json:"pool" yaml:"pool"`
}

type JWTConf struct {
	Secret     string `json:"secret" yaml:"secret"`
	Algorithms string `json:"algorithms" yaml:"algorithms"`
}

type LoggerConf struct {
	Path     string `json:"path" yaml:"path"`
	FileName string `json:"fileName" yaml:"fileName"`
	Format   string `json:"format" yaml:"format"`
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
	Port     string `json:"port"`
}

type AgoraConf struct {
	APPID         string  `json:"appId" yaml:"appId"`
	Certificate   string  `json:"certificate" yaml:"certificate"`
	RestfulID     string  `json:"restfulId" yaml:"restfulId"`
	RestfulSecret string  `json:"restfulSecret" yaml:"restfulSecret"`
	OSS           OSSConf `json:"oss" yaml:"oss"`
}

type OSSConf struct {
	Vendor    string `json:"vendor" yaml:"vendor"`
	AccessKey string `json:"accessKey" yaml:"accessKey"`
	SecretKey string `json:"secretKey" yaml:"secretKey"`
	Region    string `json:"region" yaml:"region"`
	Bucket    string `json:"bucket" yaml:"bucket"`
	Folder    string `json:"folder" yaml:"folder"`
	Prefix    string `json:"prefix" yaml:"prefix"`
}

type StorageConf struct {
	Concurrent         int                         `json:"concurrent" yaml:"concurrent"`
	SingleFileSize     int                         `json:"singleFileSize" yaml:"singleFileSize"`
	TotalSize          int                         `json:"totalSize" yaml:"totalSize"`
	PrefixPath         string                      `json:"prefixPath" yaml:"prefixPath"`
	AllowFileSuffix    string                      `json:"allowFileSuffix" yaml:"allowFileSuffix"`
	AllowURLFileSuffix string                      `json:"allowURlFileSuffix" yaml:"allowURlFileSuffix"`
	Type               map[string]CloudStorageConf `json:"type" yaml:"type"`
}

type CloudStorageConf struct {
	AccessKey string `json:"accessKey" yaml:"accessKey"`
	SecretKey string `json:"secretKey" yaml:"secretKey"`
	Endpoint  string `json:"endpoint" yaml:"endpoint"`
	Bucket    string `json:"bucket" yaml:"bucket"`
	Region    string `json:"region" yaml:"region"`
}

type Whiteboard struct {
	AccessKey string `json:"accessKey" yaml:"accessKey"`
	Secretkey string `json:"secretKey" yaml:"secretKey"`
}
