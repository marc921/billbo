package skus

import "github.com/labstack/echo/v4"

func (h *SKUHandler) Routes(e *echo.Group) {
	e.POST("", h.CreateSKU)
	e.GET("", h.ListSKUs)
	e.DELETE("/:id", h.RevokeSKU)
}
