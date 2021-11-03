package api

import (
	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/api/middleware"
	"github.com/netless-io/flat-server/logger"
)

func InitRoute() *gin.Engine {
	app := gin.New()

	gin.DisableConsoleColor()

	// local dev
	gin.SetMode(gin.DebugMode)

	app.Use(middleware.Logger())

	// test logger
	app.GET("/test", HandleTest)

	return app
}

func HandleTest(ctx *gin.Context) {
	// 去参数
	log, exists := ctx.Get("logger")
	if !exists {
		panic(111)
	}

	logger, ok := log.(*logger.TraceLog)
	if !ok {
		panic(222)
	}

	logger.Info("", 3333)

}
