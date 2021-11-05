package api

import (
	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/api/middleware"
	"github.com/netless-io/flat-server/logger"
)

func InitRoute(mod string) *gin.Engine {
	app := gin.New()

	// default debug
	if mod == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	logger.Infof("run mod %s ...", mod)
	app.Use(middleware.Logger())

	return app
}
