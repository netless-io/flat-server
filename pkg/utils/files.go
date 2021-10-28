package utils

import (
	"fmt"
	"strings"
)

// FileExtension get the file suffix to determine the file type
// currently used for configuration files
func FileExtension(path string) (string, error) {
	suffixIndex := strings.LastIndex(path, ".")
	if suffixIndex < 0 {
		return "", fmt.Errorf("unknown file type: %s", path)
	}

	fileType := path[suffixIndex+1:]

	return strings.ToLower(fileType), nil
}
