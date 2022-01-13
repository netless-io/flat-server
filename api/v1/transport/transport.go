package transport

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/netless-io/flat-server/api/middleware"
	"github.com/netless-io/flat-server/errors"
)

type Status int

const (
	NoLogin Status = -1
	Success        = iota - 1
	Failed
	Process
	AuthFailed
	NotMethod
	NoRoute
)

type Response struct {
	gCtx        *gin.Context
	httpCode    int
	userUUID    string
	loginSource string

	Err    error       `json:"-"`
	Status int         `json:"status"`
	Code   int         `json:"code,omitempty"`
	Data   interface{} `json:"data,omitempty"`
}

func HandleNoMethod(gCtx *gin.Context) {
	resp := new(Response)
	resp.Status = NotMethod
	defer resp.JSONWithHTTPCode(http.StatusMethodNotAllowed)
}

func HandleNoRoute(gCtx *gin.Context) {
	resp := new(Response)
	resp.Status = NoRoute
	defer resp.JSONWithHTTPCode(http.StatusNotFound)
}

func NewResp(gCtx *gin.Context) *Response {
	userUUID, loginSource := getUserIDWithLoginSource(gCtx)

	return &Response{
		gCtx:        gCtx,
		userUUID:    userUUID,
		loginSource: loginSource,
		httpCode:    http.StatusOK,
	}
}

func (resp *Response) GetUserUUID() string {
	return resp.userUUID
}

func (resp *Response) GetLoginSource() string {
	return resp.loginSource
}

func (resp *Response) GetContext() context.Context {

	ctx := context.Background()

	requestID, exists := resp.gCtx.Get("request_id")
	if exists {
		ctx = context.WithValue(ctx, "request_id", requestID)
		return ctx
	}

	return ctx
}

func getUserIDWithLoginSource(gCtx *gin.Context) (string, string) {
	userAuth, exists := gCtx.Get("user_auth")
	if !exists {
		return "", ""
	}

	if userPayLoad, ok := userAuth.(middleware.UserPayLoad); ok {
		return userPayLoad.UserID, userPayLoad.LoginSource
	}

	return "", ""

}

func (resp *Response) JSONWithHTTPCode(httpCode int) {
	resp.httpCode = httpCode
	resp.JSON()
}

func (resp *Response) JSON() {
	defer resp.gCtx.JSON(resp.httpCode, resp)

	if resp.Err == nil {
		return
	}

	errCode, ok := resp.Err.(errors.Code)
	if !ok {
		resp.httpCode = http.StatusInternalServerError
		errCode = errors.ServerFail
		resp.Status = int(Failed)
		resp.Data = nil
		return
	}

	if resp.Code = errCode.Code(); resp.Code != 0 {
		resp.Data = nil
	}

}
