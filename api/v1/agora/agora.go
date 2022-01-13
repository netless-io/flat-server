package agora

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(agoraGroup *gin.RouterGroup) {

	agoraRoute := agoraGroup.Group("/agora")
	{
		agoraRoute.POST("/token/generate/rtc", HandleGenRTCToken)
		agoraRoute.POST("/token/generate/rtm", HandleGenRTMToken)
	}
}

func HandleGenRTCToken(gCtx *gin.Context) {
	// TODO code
}

func HandleGenRTMToken(gCtx *gin.Context) {
	// TODO code
}
