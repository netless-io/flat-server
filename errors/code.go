package errors

const (
	ParamsCheckFailed    Code = iota + 100000 // parameter verification failed
	ServerFail                                // server fail (retry)
	CurrentProcessFailed                      // current processing failed
	NotPermission                             // insufficient permissions
	NeedLoginAgain                            // user need login in again
	UnsupportedPlatform                       // Unsupported login platform
	JWTSignFailed                             // jwt sign failed
)

const (
	RoomNotFound     Code = iota + 200000 // room not found
	RoomIsEnded                           // room has been ended
	RoomIsRunning                         // room status is running
	RoomNotIsRunning                      // room not is running
	RoomNotIsEnded                        // room not is stopped
	RoomNotIsIdle                         // room not is idle
)

const (
	PeriodicNotFound          Code = iota + 300000 // room not found
	PeriodicIsEnded                                // room has been ended
	PeriodicSubRoomHasRunning                      // periodic sub room has running
)

const (
	UserNotFound Code = 400000 // user not found

	RecordNotFound Code = 500000 // record info not found
)

const (
	UploadConcurrentLimit Code = iota + 700000
	NotEnoughTotalUsage        // not enough total usage
	FileSizeTooBig             // single file size too big
	FileNotFound               // file info not found
	FileExists                 // file already exists
)

const (
	FileIsConverted      Code = 800000
	FileConvertFailed         // file convert failed
	FileIsConverting          // file is converting
	FileIsConvertWaiting      // file convert is in waiting status
)

const (
	LoginGithubSuspended Code = iota + 900000 // https://docs.github.com/en/developers/apps/troubleshooting-authorization-request-errors
	LoginGithubURLMismatch
	LoginGithubAccessDenied
)
