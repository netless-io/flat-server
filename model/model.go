package model

import (
	"fmt"
	"time"

	"github.com/netless-io/flat-server/conf"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

const (
	defaultConnMaxLifetime = 5
	defaultMaxOpenConns    = 10
	defaultMaxIdleConns    = 10
)

var (
	dbClient *gorm.DB
)

func OpenDBConn(conf conf.MySQLConf) error {
	var (
		err error
	)

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true&charset=utf8mb4", conf.Username, conf.Password, conf.Host, conf.Port, conf.Name)

	dbClient, err = gorm.Open(mysql.New(mysql.Config{
		// data source name, refer https://github.com/go-sql-driver/mysql#dsn-data-source-name
		DSN: dsn,

		// add default size for string fields, by default, will use db type `longtext` for fields without size
		// not a primary key, no index defined and don't have default values
		DefaultStringSize: 256,

		// disable datetime precision support, which not supported before MySQL 5.6
		DisableDatetimePrecision: true,

		// drop & create index when rename index, rename index not supported before MySQL 5.7, MariaDB
		DontSupportRenameIndex: true,

		// use change when rename column, rename rename not supported before MySQL 8, MariaDB
		DontSupportRenameColumn: true,

		// smart configure based on used version
		SkipInitializeWithVersion: false,
	}), &gorm.Config{})

	if err != nil {
		return err
	}

	// see https://github.com/go-sql-driver/mysql
	sqlConn, err := dbClient.DB()
	if err != nil {
		return err
	}

	var (
		connMaxLifetime, maxOpenConns, maxIdleConns int
	)

	if connMaxLifetime = conf.ConnMaxLifetime; connMaxLifetime <= 0 {
		connMaxLifetime = defaultConnMaxLifetime
	}

	if maxOpenConns = conf.MaxOpenConns; maxOpenConns <= 0 {
		maxOpenConns = defaultMaxOpenConns
	}

	if maxIdleConns = conf.MaxIdleConns; maxIdleConns <= 0 {
		maxIdleConns = defaultMaxIdleConns
	}

	sqlConn.SetConnMaxLifetime(time.Minute * time.Duration(connMaxLifetime))
	sqlConn.SetMaxOpenConns(maxOpenConns)
	sqlConn.SetMaxIdleConns(maxIdleConns)

	return nil
}
