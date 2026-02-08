package events

import (
	"fmt"
	"net/http"
	"time"

	"billbo.com/backend/api/dashboard/auth"
	"billbo.com/backend/database/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type EventHandler struct {
	logger  *zap.Logger
	queries *sqlcgen.Queries
}

type Event struct {
	MerchantID uuid.UUID `json:"merchant_id"`
	CustomerID uuid.UUID `json:"customer_id"`
	SKU_ID     uuid.UUID `json:"sku_id"`
	Amount     float64   `json:"amount"`
	SentAt     time.Time `json:"sent_at"`
}

func NewEventHandler(
	logger *zap.Logger,
	queries *sqlcgen.Queries,
) *EventHandler {
	return &EventHandler{
		logger: logger.With(
			zap.String("api", "ingest"),
			zap.String("handler", "event"),
		),
		queries: queries,
	}
}

type PostEventRequest struct {
	CustomerID uuid.UUID `json:"customer_id"`
	SKU_ID     uuid.UUID `json:"sku_id"`
	Amount     float64   `json:"amount"`
	SentAt     time.Time `json:"sent_at"`
}

func (h *EventHandler) PostEvent(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("PostEvent: %w", err))
	}

	var event PostEventRequest
	if err := c.Bind(&event); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request").
			WithInternal(fmt.Errorf("c.Bind: %w", err))
	}
	err = h.queries.InsertEvent(c.Request().Context(), sqlcgen.InsertEventParams{
		MerchantID: pgtype.UUID{Bytes: merchantID, Valid: true},
		CustomerID: pgtype.UUID{Bytes: event.CustomerID, Valid: true},
		SkuID:      pgtype.UUID{Bytes: event.SKU_ID, Valid: true},
		Amount:     event.Amount,
		SentAt:     pgtype.Timestamptz{Time: event.SentAt, Valid: true},
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to insert event").
			WithInternal(fmt.Errorf("queries.InsertEvent: %w", err))
	}
	return c.NoContent(http.StatusCreated)
}

func (h *EventHandler) GetEvents(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("GetEvents: %w", err))
	}
	events, err := h.queries.ListEventsByMerchantID(c.Request().Context(), pgtype.UUID{Bytes: merchantID, Valid: true})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list events").
			WithInternal(fmt.Errorf("queries.ListEventsByMerchantID: %w", err))
	}
	return c.JSON(http.StatusOK, events)
}
