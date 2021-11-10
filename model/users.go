package model

import (
	"time"
)

// UsersColumns get sql column name.
var UsersColumns = struct {
	ID           string
	CreatedAt    string
	UpdatedAt    string
	Version      string
	UserUUID     string
	UserName     string
	UserPassword string
	AvatarURL    string
	Gender       string
	IsDelete     string
}{
	ID:           "id",
	CreatedAt:    "created_at",
	UpdatedAt:    "updated_at",
	Version:      "version",
	UserUUID:     "user_uuid",
	UserName:     "user_name",
	UserPassword: "user_password",
	AvatarURL:    "avatar_url",
	Gender:       "gender",
	IsDelete:     "is_delete",
}

// Users [...]
type Users struct {
	ID           int64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	CreatedAt    time.Time `gorm:"column:created_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt    time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
	Version      int       `gorm:"column:version;type:int(11);not null"`
	UserUUID     string    `gorm:"unique;column:user_uuid;type:varchar(40);not null"`
	UserName     string    `gorm:"column:user_name;type:varchar(50);not null"`
	UserPassword string    `gorm:"column:user_password;type:varchar(255);not null"`
	AvatarURL    string    `gorm:"column:avatar_url;type:varchar(2083);not null"`
	Gender       string    `gorm:"column:gender;type:enum('Man','Woman','None');not null;default:None"`
	IsDelete     int8      `gorm:"index:users_is_delete_index;column:is_delete;type:tinyint(4);not null;default:0"`
}

// TableName get sql table name.
func (m *Users) TableName() string {
	return "users"
}
