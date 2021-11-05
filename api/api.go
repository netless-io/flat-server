package api

import (
	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/api/middleware"
	v1 "github.com/netless-io/flat-server/api/v1"
)

func InitRoute() *gin.Engine {
	app := gin.New()

	gin.DisableConsoleColor()

	// local dev
	gin.SetMode(gin.DebugMode)

	app.Use(middleware.Logger())

	apiV1 := app.Group("/v1")
	{
		v1.RegisterUsersRoutes(apiV1)
	}

	return app
}
