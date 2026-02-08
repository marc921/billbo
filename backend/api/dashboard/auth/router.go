package auth

import "github.com/labstack/echo/v4"

func (h *AuthHandler) Routes(e *echo.Group) {
	e.POST("/signup", h.Signup)
	e.POST("/login", h.Login)
	e.POST("/logout", h.Logout)
	e.GET("/me", h.Me, JWTMiddleware(h.jwtSecret))
}
