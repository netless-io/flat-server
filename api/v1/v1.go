package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/api/v1/agora"
	cloudstorage "github.com/netless-io/flat-server/api/v1/cloud_storage"
	"github.com/netless-io/flat-server/api/v1/login"
	"github.com/netless-io/flat-server/api/v1/room"
	transportV1 "github.com/netless-io/flat-server/api/v1/transport"
)

func RegisterAPIv1Routes(v1Group *gin.Engine) {
	v1Group.NoMethod(transportV1.HandleNoMethod)
	v1Group.NoRoute(transportV1.HandleNoRoute)

	apiV1 := v1Group.Group("/v1")
	{
		agora.RegisterRoutes(apiV1)
		cloudstorage.RegisterRoutes(apiV1)
		room.RegisterRoutes(apiV1)
		login.RegisterRoutes(apiV1)
	}
}
