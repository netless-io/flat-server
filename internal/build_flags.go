package internal

var (
	// ENV go build -ldflags "-s -w -X $(PKG_NAME)/internal.ENV=production" -o flat-server
	// development / production / test
	ENV = "development"
)
