package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"

	"billbo.com/backend/database/sqlcgen"
	"github.com/labstack/echo/v4"
)

// APIKeyMiddleware validates API keys from the Authorization header
// and sets the merchant_id in the Echo context.
func APIKeyMiddleware(queries *sqlcgen.Queries) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if header == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing Authorization header")
			}

			rawKey, ok := strings.CutPrefix(header, "Bearer ")
			if !ok || rawKey == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid Authorization header format")
			}

			h := sha256.Sum256([]byte(rawKey))
			keyHash := hex.EncodeToString(h[:])

			row, err := queries.GetAPIKeyByHash(c.Request().Context(), keyHash)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid API key").
					WithInternal(fmt.Errorf("queries.GetAPIKeyByHash: %w", err))
			}

			if row.RevokedAt.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "API key has been revoked")
			}

			c.Set("merchant_id", row.MerchantID.String())

			return next(c)
		}
	}
}
