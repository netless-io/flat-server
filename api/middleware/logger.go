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
	Latency    string       `json:"latency"`
	Method     string       `json:"method"`
	StatusCode int          `json:"status_code"`
	BodySize   int          `json:"body_size"`
	ClientIP   string       `json:"client_ip"`
	Path       string       `json:"path"`
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
		raw := c.Request.URL.RawQuery

		requestID := strings.ReplaceAll(uuid.New().String(), "-", "")
		log := logger.NewTraceLog(requestID)

		c.Set("logger", log)

		// Process request
		c.Next()

		payload := PayLoad{
			Latency:    time.Since(start).String(),
			ClientIP:   c.ClientIP(),
			Method:     c.Request.Method,
			StatusCode: c.Writer.Status(),
			BodySize:   c.Writer.Size(),
		}

		if raw != "" {
			path = path + "?" + raw
		}

		payload.Path = path
		log.Infow("", zap.Any("payload", payload))

	}
}
