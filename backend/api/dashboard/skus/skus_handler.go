package skus

import (
	"fmt"
	"net/http"

	"billbo.com/backend/api/dashboard/auth"
	"billbo.com/backend/database/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type SKUHandler struct {
	logger  *zap.Logger
	queries *sqlcgen.Queries
}

// TODO: handle currencies: per sku? per merchant? per customer?
func NewSKUHandler(
	logger *zap.Logger,
	queries *sqlcgen.Queries,
) *SKUHandler {
	return &SKUHandler{
		logger: logger.With(
			zap.String("api", "dashboard"),
			zap.String("handler", "skus"),
		),
		queries: queries,
	}
}

type SKUResponse struct {
	ID           string  `json:"ID"`
	Name         string  `json:"Name"`
	Unit         *string `json:"Unit"`
	PricePerUnit float64 `json:"PricePerUnit"`
	RevokedAt    *string `json:"RevokedAt"`
	CreatedAt    string  `json:"CreatedAt"`
}

func (r *SKUResponse) FromDB(row *sqlcgen.Sku) *SKUResponse {
	if row == nil {
		return nil
	}
	r.ID = row.ID.String()
	r.Name = row.Name
	if row.Unit.Valid {
		r.Unit = &row.Unit.String
	}
	r.PricePerUnit = row.PricePerUnit
	if row.RevokedAt.Valid {
		s := row.RevokedAt.Time.String()
		r.RevokedAt = &s
	}
	r.CreatedAt = row.CreatedAt.Time.String()
	return r
}

type CreateSKURequest struct {
	Name         string  `json:"name" validate:"required"`
	Unit         *string `json:"unit"`
	PricePerUnit float64 `json:"price_per_unit" validate:"gt=0"`
}

func (h *SKUHandler) CreateSKU(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("CreateSKU: %w", err))
	}

	var req CreateSKURequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request").
			WithInternal(fmt.Errorf("c.Bind: %w", err))
	}

	var unit pgtype.Text
	if req.Unit != nil && *req.Unit != "" {
		unit = pgtype.Text{String: *req.Unit, Valid: true}
	}

	row, err := h.queries.CreateSKU(c.Request().Context(), sqlcgen.CreateSKUParams{
		MerchantID:   pgtype.UUID{Bytes: merchantID, Valid: true},
		Name:         req.Name,
		Unit:         unit,
		PricePerUnit: req.PricePerUnit,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create SKU").
			WithInternal(fmt.Errorf("queries.CreateSKU: %w", err))
	}

	return c.JSON(http.StatusCreated, new(SKUResponse).FromDB(row))
}

func (h *SKUHandler) ListSKUs(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("ListSKUs: %w", err))
	}

	rows, err := h.queries.ListSKUsByMerchantID(c.Request().Context(), pgtype.UUID{Bytes: merchantID, Valid: true})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list SKUs").
			WithInternal(fmt.Errorf("queries.ListSKUsByMerchantID: %w", err))
	}

	skus := make([]*SKUResponse, len(rows))
	for i, row := range rows {
		skus[i] = new(SKUResponse).FromDB(row)
	}
	return c.JSON(http.StatusOK, skus)
}

type RevokeSKURequest struct {
	ID uuid.UUID `param:"id" validate:"required"`
}

func (h *SKUHandler) RevokeSKU(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("RevokeSKU: %w", err))
	}

	var req RevokeSKURequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid SKU ID").
			WithInternal(fmt.Errorf("c.Bind: %w", err))
	}

	err = h.queries.RevokeSKU(c.Request().Context(), sqlcgen.RevokeSKUParams{
		ID:         pgtype.UUID{Bytes: req.ID, Valid: true},
		MerchantID: pgtype.UUID{Bytes: merchantID, Valid: true},
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to revoke SKU").
			WithInternal(fmt.Errorf("queries.RevokeSKU: %w", err))
	}

	return c.NoContent(http.StatusNoContent)
}
