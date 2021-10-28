package utils

import (
	"testing"
)

func TestFileExtension(t *testing.T) {
	file1 := "aa.txt"
	f1, err := FileExtension(file1)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(f1)

	file2 := "aa"
	f2, err := FileExtension(file2)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(f2)
}
