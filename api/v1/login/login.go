package login

import "github.com/gin-gonic/gin"

func RegisterRoutes(loginGroup *gin.RouterGroup) {
	loginRoutes := loginGroup.Group("/login")
	{
		loginRoutes.GET("/github/callback", HandleGithubCallback)

		loginRoutes.GET("login/weChat/web/callback", HandleWechatWebCallback)
		loginRoutes.GET("login/weChat/mobile/callback", HandleWechatMobileCallback)
	}
}
