package ingest

import "github.com/labstack/echo/v4"

func (h *EventHandler) Routes(e *echo.Group) {
	e.GET("/", h.GetEvents)
	e.POST("/", h.PostEvent)
}
