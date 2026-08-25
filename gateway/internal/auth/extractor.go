package auth

import (
	"encoding/base64"
	"net/http"
	"strings"
)

type ProxyCredentials struct {
	RawUsername string
	Username    string
	Password    string
	SessionID   string
	Country     string
}

// ExtractCredentials parses Basic auth credentials and inline routing parameters
func ExtractCredentials(r *http.Request) *ProxyCredentials {
	authHeader := r.Header.Get("Proxy-Authorization")
	if authHeader == "" {
		authHeader = r.Header.Get("Authorization")
	}
	if authHeader == "" {
		return nil
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "basic") {
		return nil
	}

	payload, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return nil
	}

	pair := strings.SplitN(string(payload), ":", 2)
	if len(pair) != 2 {
		return nil
	}

	rawUsername := pair[0]
	password := pair[1]

	creds := &ProxyCredentials{
		RawUsername: rawUsername,
		Username:    rawUsername,
		Password:    password,
	}

	// Parse inline session or country modifiers: user-country-US-session-abc123
	if strings.Contains(rawUsername, "-session-") {
		sessionParts := strings.Split(rawUsername, "-session-")
		if len(sessionParts) > 1 {
			creds.SessionID = strings.Split(sessionParts[1], "-")[0]
		}
	}

	if strings.Contains(rawUsername, "-country-") {
		countryParts := strings.Split(rawUsername, "-country-")
		if len(countryParts) > 1 {
			creds.Country = strings.Split(countryParts[1], "-")[0]
		}
	}

	// Base username before hyphenated flags
	if strings.Contains(rawUsername, "-") {
		creds.Username = strings.Split(rawUsername, "-")[0]
	}

	return creds
}
