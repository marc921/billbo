package apikeys

import "github.com/labstack/echo/v4"

func (h *APIKeyHandler) Routes(e *echo.Group) {
	e.POST("/", h.CreateAPIKey)
	e.GET("/", h.ListAPIKeys)
	e.DELETE("/:id", h.RevokeAPIKey)
}
