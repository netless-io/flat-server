package logger

import (
	"go.uber.org/zap"
)

type TraceLog struct {
	requestID string
	l         *zap.SugaredLogger
}

func NewTraceLog(requestID string) *TraceLog {

	tlog := &TraceLog{
		requestID: requestID,
	}

	// copy new logger with key
	tlog.l = logger.With(zap.String("request_id", tlog.requestID))
	return tlog
}

func (t *TraceLog) Debug(args ...interface{}) {
	t.l.Debug(args...)
}

func (t *TraceLog) Debugf(template string, args ...interface{}) {
	t.l.Debugf(template, args...)

}

func (t *TraceLog) Debugw(template string, args ...interface{}) {
	t.l.Debugw(template, args...)

}

func (t *TraceLog) Info(args ...interface{}) {
	t.l.Info(args...)
}

func (t *TraceLog) Infof(template string, args ...interface{}) {
	t.l.Infof(template, args...)

}

func (t *TraceLog) Infow(template string, args ...interface{}) {
	t.l.Infow(template, args...)

}

func (t *TraceLog) Warn(args ...interface{}) {
	t.l.Warn(args...)
}

func (t *TraceLog) Warnf(template string, args ...interface{}) {
	t.l.Warnf(template, args...)
}

func (t *TraceLog) Warnw(template string, args ...interface{}) {
	t.l.Warnw(template, args...)
}

func (t *TraceLog) Error(args ...interface{}) {
	t.l.Error(args...)
}

func (t *TraceLog) Errorf(template string, args ...interface{}) {
	t.l.Errorf(template, args...)
}

func (t *TraceLog) Errorw(template string, args ...interface{}) {
	t.l.Errorw(template, args...)
}
