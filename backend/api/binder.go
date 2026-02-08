package api

import (
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

// ValidatingBinder wraps Echo's default binder to add struct validation
// via go-playground/validator after binding.
type ValidatingBinder struct {
	binder   echo.Binder
	validate *validator.Validate
}

func NewValidatingBinder() *ValidatingBinder {
	return &ValidatingBinder{
		binder:   &echo.DefaultBinder{},
		validate: validator.New(validator.WithRequiredStructEnabled()),
	}
}

func (vb *ValidatingBinder) Bind(i interface{}, c echo.Context) error {
	if err := vb.binder.Bind(i, c); err != nil {
		return err
	}
	return vb.validate.Struct(i)
}
