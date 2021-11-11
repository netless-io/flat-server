package model

import (
	"time"
)

// UserWechatColumns get sql column name.
var UserWechatColumns = struct {
	ID        string
	CreatedAt string
	UpdatedAt string
	Version   string
	UserUUID  string
	UserName  string
	OpenUUID  string
	UnionUUID string
	IsDelete  string
}{
	ID:        "id",
	CreatedAt: "created_at",
	UpdatedAt: "updated_at",
	Version:   "version",
	UserUUID:  "user_uuid",
	UserName:  "user_name",
	OpenUUID:  "open_uuid",
	UnionUUID: "union_uuid",
	IsDelete:  "is_delete",
}

// UserWechat [...]
type UserWechat struct {
	ID        int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version   int       `gorm:"column:version;type:int(11);not null"`
	UserUUID  string    `gorm:"unique;column:user_uuid;type:varchar(40);not null"`
	UserName  string    `gorm:"column:user_name;type:varchar(40);not null"`  // wechat nickname
	OpenUUID  string    `gorm:"column:open_uuid;type:varchar(40);not null"`  // wechat open id
	UnionUUID string    `gorm:"column:union_uuid;type:varchar(40);not null"` // wechat union id
	IsDelete  int8      `gorm:"index:user_wechat_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *UserWechat) TableName() string {
	return "user_wechat"
}
