package logger

var (
	wlog Logger
)

func init() {
	wlog = New(nil)

}

func Debug(args ...interface{}) {
	wlog.Debug(args...)
}

func Debugf(template string, args ...interface{}) {
	wlog.Debugf(template, args...)
}

func Info(args ...interface{}) {
	wlog.Info(args...)
}

func Infof(template string, args ...interface{}) {
	wlog.Infof(template, args...)
}

func Warn(args ...interface{}) {
	wlog.Warn(args...)
}

func Warnf(template string, args ...interface{}) {
	wlog.Warnf(template, args...)
}

func Error(args ...interface{}) {
	wlog.Error(args...)
}

func Errorf(template string, args ...interface{}) {
	wlog.Errorf(template, args...)
}

func Fatal(args ...interface{}) {
	wlog.Fatal(args...)
}

func Fatalf(template string, args ...interface{}) {
	wlog.Fatalf(template, args...)
}
