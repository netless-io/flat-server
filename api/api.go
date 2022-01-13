package api

import (
	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/api/middleware"

	apiV1 "github.com/netless-io/flat-server/api/v1"
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

	apiV1.RegisterAPIv1Routes(app)

	return app
}
