package internal

var (
	// Version go build -ldflags "-s -w -X $(PKG_NAME)/internal.Version=v1.0.1" -o flat-server
	Version = ""

	// ENV go build -ldflags "-s -w -X $(PKG_NAME)/internal.ENV=production" -o flat-server
	ENV = "development"
)
