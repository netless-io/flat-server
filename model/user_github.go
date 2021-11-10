package model

import (
	"time"
)

// UserGithubColumns get sql column name.
var UserGithubColumns = struct {
	ID          string
	CreatedAt   string
	UpdatedAt   string
	Version     string
	UserUUID    string
	UserName    string
	IsDelete    string
	AccessToken string
	UnionUUID   string
}{
	ID:          "id",
	CreatedAt:   "created_at",
	UpdatedAt:   "updated_at",
	Version:     "version",
	UserUUID:    "user_uuid",
	UserName:    "user_name",
	IsDelete:    "is_delete",
	AccessToken: "access_token",
	UnionUUID:   "union_uuid",
}

// UserGithub [...]
type UserGithub struct {
	ID          int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt   time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt   time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version     int       `gorm:"column:version;type:int(11);not null"`
	UserUUID    string    `gorm:"unique;column:user_uuid;type:varchar(40);not null"`
	UserName    string    `gorm:"column:user_name;type:varchar(40);not null"` // github nickname
	IsDelete    int8      `gorm:"index:user_github_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
	AccessToken string    `gorm:"column:access_token;type:varchar(255);default:''"` // [deprecated]: github access token
	UnionUUID   string    `gorm:"column:union_uuid;type:varchar(32);not null"`      // github id
}

// TableName get sql table name.
func (m *UserGithub) TableName() string {
	return "user_github"
}
