package storage

import (
	"io"
	"path/filepath"
	"time"

	// TODO this may not be a good log file library.
	// because he no longer updates the maintenance
	// even warned by the author not to continue using it
	rotatelogs "github.com/lestrrat-go/file-rotatelogs"
)

func LocalFileWriter(path, name string, rotationTime, rotationCount uint) io.Writer {
	writer, _ := rotatelogs.New(
		filepath.Join(path, name+".%Y-%m-%d-%H.log"),
		rotatelogs.WithRotationTime(time.Duration(rotationTime)*time.Hour), // Log cutting interval
		rotatelogs.WithRotationCount(rotationCount),                        // Maximum number of log files to be saved
	)

	return writer
}
