package auth

import (
	"crypto/sha256"
	"encoding/hex"
)

// TokenDigest is a one-way verifier for high-entropy random bearer tokens.
func TokenDigest(token string) string {
	sum := sha256.Sum256([]byte(token))
	return "sha256:" + hex.EncodeToString(sum[:])
}
