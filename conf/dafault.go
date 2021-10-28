package conf

import "github.com/netless-io/flat-server/pkg/utils"

var defaultConf = struct {
	StorageConcurrent         int
	StorageSingleFileSize     int
	StorageTotalSize          int
	StoragePrefixPath         string
	StorageAllowFileSuffix    string
	StorageAllowUrlFileSuffix string
}{
	StorageConcurrent:         3,
	StorageSingleFileSize:     500 * utils.MiB,
	StorageTotalSize:          2 * utils.GiB,
	StoragePrefixPath:         "cloud-storage",
	StorageAllowFileSuffix:    "ppt,pptx,doc,docx,pdf,png,jpg,jpeg,gif,mp3,mp4,ice",
	StorageAllowUrlFileSuffix: "vf",
}

func SafeSetDefault(conf *FlatConf) {
	if conf.Storage.Concurrent <= 0 {
		conf.Storage.Concurrent = defaultConf.StorageConcurrent
	}

	if conf.Storage.SingleFileSize <= 0 {
		conf.Storage.SingleFileSize = defaultConf.StorageSingleFileSize
	}

	if conf.Storage.TotalSize <= 0 {
		conf.Storage.TotalSize = defaultConf.StorageTotalSize
	}

	if conf.Storage.PrefixPath == "" {
		conf.Storage.PrefixPath = defaultConf.StoragePrefixPath
	}

	if conf.Storage.AllowFileSuffix == "" {
		conf.Storage.AllowFileSuffix = defaultConf.StorageAllowFileSuffix
	}

	if conf.Storage.AllowURLFileSuffix == "" {
		conf.Storage.AllowURLFileSuffix = defaultConf.StorageAllowUrlFileSuffix
	}
}
