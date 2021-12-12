package errors

import "strconv"

type Code int

func (e Code) Code() int {
	return int(e)
}

func (e Code) Error() string {

	return strconv.Itoa(int(e))
}
