package room

import "github.com/gin-gonic/gin"

func RegisterRoutes(roomGroup *gin.RouterGroup) {
	// TODO register route. handle func
	roomRoute := roomGroup.Group("/room")
	{
		roomRoute.POST("/cancel/history")
		roomRoute.POST("/cancel/ordinary")
		roomRoute.POST("/cancel/periodic")
		roomRoute.POST("/cancel/periodic-sub-room")

		roomRoute.POST("/create/ordinary")
		roomRoute.POST("/create/periodic")

		roomRoute.POST("/info/ordinary")
		roomRoute.POST("/info/periodic")
		roomRoute.POST("/info/periodic-sub-room")
		roomRoute.POST("/info/users")

		roomRoute.POST("/join")
		roomRoute.POST("/list/:type")

		roomRoute.POST("/record/info")

	}
}
