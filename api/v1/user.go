package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/logger"
)

func RegisterUsersRoutes(userGroup gin.IRouter) {
	user := userGroup.Group("/user")
	{
		// test logger
		user.GET("/test", HandleUserTest)
	}
}

func HandleUserTest(ctx *gin.Context) {
	// 去参数
	log, exists := ctx.Get("logger")
	if !exists {
		panic(111)
	}

	logger, ok := log.(*logger.TraceLog)
	if !ok {
		panic(222)
	}

	logger.Info("3333")

}
