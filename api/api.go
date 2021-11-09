package api

import (
	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/api/middleware"
)

func New(env string) *gin.Engine {
	app := gin.New()

	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else if env == "test" {
		gin.SetMode(gin.TestMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	app.Use(middleware.Logger())

	return app
}
