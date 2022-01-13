package login

import "github.com/gin-gonic/gin"

func RegisterRoutes(loginGroup *gin.RouterGroup) {
	loginRoutes := loginGroup.Group("/login")
	{
		loginRoutes.GET("/github/callback", HandleGithubCallback)

		loginRoutes.GET("/weChat/web/callback", HandleWechatWebCallback)
		loginRoutes.GET("/weChat/mobile/callback", HandleWechatMobileCallback)
	}
}
