package middleware

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/netless-io/flat-server/logger"
	"go.uber.org/zap"
)

type PayLoad struct {
	DurationMS int64        `json:"duration_ms"`
	Method     string       `json:"method"`
	StatusCode int          `json:"status_code"`
	BodySize   int          `json:"body_size"`
	User       *UserPayLoad `json:"user,omitempty"`
}

type UserPayLoad struct {
	UserID      string `json:"user_id,omitempty"`
	LoginSource string `json:"login_source,omitempty"`
	IAT         int64  `json:"iat,omitempty"`
	EXP         int64  `json:"exp,omitempty"`
}

func Logger() gin.HandlerFunc {

	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		requestID := strings.ReplaceAll(uuid.New().String(), "-", "")
		c.Set("request_id", requestID)

		// Process request
		c.Next()

		bodySize := c.Writer.Size()
		if bodySize < 0 {
			bodySize = 0
		}

		payload := PayLoad{
			DurationMS: time.Since(start).Milliseconds(),
			Method:     c.Request.Method,
			BodySize:   bodySize,
			StatusCode: c.Writer.Status(),
		}

		// TODO jwt trace log
		if userAuth, exists := c.Get("user_auth"); exists {
			if userPayLoad, ok := userAuth.(UserPayLoad); ok {
				payload.User = &userPayLoad
			}
		}

		param := make(map[string]PayLoad)
		param[path] = payload

		logger.Infow("router info", zap.String("request_id", requestID), zap.Any("payload", param))

	}
}
