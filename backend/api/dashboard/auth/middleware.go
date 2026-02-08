package auth

import (
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// MerchantID extracts and parses the merchant ID from the Echo context
// (set by JWTMiddleware).
func MerchantID(c echo.Context) (uuid.UUID, error) {
	raw, ok := c.Get("merchant_id").(string)
	if !ok {
		return uuid.UUID{}, fmt.Errorf("MerchantID: missing or invalid merchant_id in context")
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("MerchantID: %w", err)
	}
	return id, nil
}

// JWTMiddleware returns an Echo middleware that validates JWT tokens from the
// "token" HttpOnly cookie and stores the claims in the request context.
func JWTMiddleware(secret []byte) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			cookie, err := c.Cookie(TOKEN_COOKIE_NAME)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing auth cookie")
			}

			token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return secret, nil
			})
			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token claims")
			}

			c.Set("merchant_id", claims["merchant_id"])
			c.Set("email", claims["email"])

			return next(c)
		}
	}
}
