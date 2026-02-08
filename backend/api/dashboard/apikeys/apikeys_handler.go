package apikeys

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"

	"billbo.com/backend/api/dashboard/auth"
	"billbo.com/backend/database/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type APIKeyHandler struct {
	logger  *zap.Logger
	queries *sqlcgen.Queries
}

func NewAPIKeyHandler(
	logger *zap.Logger,
	queries *sqlcgen.Queries,
) *APIKeyHandler {
	return &APIKeyHandler{
		logger: logger.With(
			zap.String("api", "dashboard"),
			zap.String("handler", "apikeys"),
		),
		queries: queries,
	}
}

type CreateAPIKeyRequest struct {
	Name string `json:"name" validate:"required"`
}

type CreateAPIKeyResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Key       string `json:"key"`
	KeyPrefix string `json:"key_prefix"`
}

func (r *CreateAPIKeyResponse) FromDB(row *sqlcgen.ApiKey, rawKey string) *CreateAPIKeyResponse {
	if row == nil {
		return nil
	}
	r.ID = row.ID.String()
	r.Name = row.Name
	r.Key = rawKey
	r.KeyPrefix = row.KeyPrefix
	return r
}

type APIKeyResponse struct {
	ID        string  `json:"ID"`
	Name      string  `json:"Name"`
	KeyPrefix string  `json:"KeyPrefix"`
	RevokedAt *string `json:"RevokedAt"`
	CreatedAt string  `json:"CreatedAt"`
}

func (r *APIKeyResponse) FromDB(row *sqlcgen.ApiKey) *APIKeyResponse {
	if row == nil {
		return nil
	}
	r.ID = row.ID.String()
	r.Name = row.Name
	r.KeyPrefix = row.KeyPrefix
	if row.RevokedAt.Valid {
		s := row.RevokedAt.Time.String()
		r.RevokedAt = &s
	}
	r.CreatedAt = row.CreatedAt.Time.String()
	return r
}

func (h *APIKeyHandler) CreateAPIKey(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("CreateAPIKey: %w", err))
	}

	var req CreateAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request").
			WithInternal(fmt.Errorf("c.Bind: %w", err))
	}

	rawKey, err := generateAPIKey()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate API key").
			WithInternal(fmt.Errorf("generateAPIKey: %w", err))
	}

	keyHash := hashKey(rawKey)
	keyPrefix := rawKey[:11] // "bb_" + first 8 hex chars

	row, err := h.queries.CreateAPIKey(c.Request().Context(), sqlcgen.CreateAPIKeyParams{
		MerchantID: pgtype.UUID{Bytes: merchantID, Valid: true},
		Name:       req.Name,
		KeyPrefix:  keyPrefix,
		KeyHash:    keyHash,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create API key").
			WithInternal(fmt.Errorf("queries.CreateAPIKey: %w", err))
	}

	return c.JSON(http.StatusCreated, new(CreateAPIKeyResponse).FromDB(row, rawKey))
}

func (h *APIKeyHandler) ListAPIKeys(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("ListAPIKeys: %w", err))
	}

	rows, err := h.queries.ListAPIKeysByMerchantID(c.Request().Context(), pgtype.UUID{Bytes: merchantID, Valid: true})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list API keys").
			WithInternal(fmt.Errorf("queries.ListAPIKeysByMerchantID: %w", err))
	}

	keys := make([]*APIKeyResponse, len(rows))
	for i, row := range rows {
		keys[i] = new(APIKeyResponse).FromDB(row)
	}
	return c.JSON(http.StatusOK, keys)
}

type RevokeAPIKeyRequest struct {
	ID uuid.UUID `param:"id" validate:"required"`
}

func (h *APIKeyHandler) RevokeAPIKey(c echo.Context) error {
	merchantID, err := auth.MerchantID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid merchant ID in token").
			WithInternal(fmt.Errorf("RevokeAPIKey: %w", err))
	}

	var req RevokeAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid API key ID").
			WithInternal(fmt.Errorf("c.Bind: %w", err))
	}

	err = h.queries.RevokeAPIKey(c.Request().Context(), sqlcgen.RevokeAPIKeyParams{
		ID:         pgtype.UUID{Bytes: req.ID, Valid: true},
		MerchantID: pgtype.UUID{Bytes: merchantID, Valid: true},
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to revoke API key").
			WithInternal(fmt.Errorf("queries.RevokeAPIKey: %w", err))
	}

	return c.NoContent(http.StatusNoContent)
}

// generateAPIKey creates a random API key with the format "bb_<32 hex chars>".
func generateAPIKey() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generateAPIKey: %w", err)
	}
	return "bb_" + hex.EncodeToString(b), nil
}

// hashKey returns the SHA-256 hex digest of a raw API key.
func hashKey(rawKey string) string {
	h := sha256.Sum256([]byte(rawKey))
	return hex.EncodeToString(h[:])
}
