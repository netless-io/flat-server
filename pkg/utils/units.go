package utils

// Binary size units
// See: http://en.wikipedia.org/wiki/Binary_prefix
const (
	_   = iota             // ignore first value by assigning to blank identifier
	KiB = 1 << (10 * iota) // 1 << (10*1)
	MiB                    // 1 << (10*2)
	GiB                    // 1 << (10*3)
	TiB                    // 1 << (10*4)
	PiB                    // 1 << (10*5)

)
