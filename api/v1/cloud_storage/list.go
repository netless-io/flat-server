package cloudstorage

import (
	"github.com/gin-gonic/gin"
	transportV1 "github.com/netless-io/flat-server/api/v1/transport"
	"github.com/netless-io/flat-server/services"
)

func HandleList(gCtx *gin.Context) {

	resp := transportV1.NewResp(gCtx)
	defer resp.JSON()

	//	userUUID:=resp.GetUserUUID()
	ctx := resp.GetContext()

	// TODO test
	userUUID := gCtx.Query("user_id")

	result, err := services.CloudStorageUserFileList(ctx, userUUID, 1, 50)
	if err != nil {
		resp.Err = err
		return
	}

	resp.Data = result
}
