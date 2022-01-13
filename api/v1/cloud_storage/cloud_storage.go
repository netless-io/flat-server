package cloudstorage

import "github.com/gin-gonic/gin"

func RegisterRoutes(storageGroup *gin.RouterGroup) {

	storageRoute := storageGroup.Group("/cloud-storage")
	{
		storageRoute.POST("/url-cloud/add", HandleUrlCloudAdd)
		storageRoute.POST("/url-cloud/remove", HandleUrlCloudRemove)
		storageRoute.POST("/url-cloud/rename", HandleUrlCloudRename)

		storageRoute.POST("/upload/cancel", HandleUploadCancel)
		storageRoute.POST("/list", HandleList)

		storageRoute.POST("/convert/start", handleConvertStart)
		storageRoute.POST("/convert/finish", handleConvertFinish)

		storageRoute.POST("/alibaba-cloud/upload/start", HandleAlibabaCloudUploadStart)
		storageRoute.POST("/alibaba-cloud/upload/finish", HandleAlibabaCloudUploadFinish)

		storageRoute.POST("/alibaba-cloud/remove", HandleAlibabaCloudRemove)
		storageRoute.POST("/alibaba-cloud/rename", HandleAlibabaCloudRename)

	}
}
