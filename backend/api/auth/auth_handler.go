package auth

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"billbo.com/backend/database/sqlcgen"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

const (
	TOKEN_COOKIE_NAME = "token"
	TOKEN_MAX_AGE     = 24 * time.Hour
)

type AuthHandler struct {
	logger    *zap.Logger
	queries   *sqlcgen.Queries
	jwtSecret []byte
}

func NewAuthHandler(
	logger *zap.Logger,
	queries *sqlcgen.Queries,
	jwtSecret []byte,
) *AuthHandler {
	return &AuthHandler{
		logger: logger.With(
			zap.String("api", "auth"),
			zap.String("handler", "auth"),
		),
		queries:   queries,
		jwtSecret: jwtSecret,
	}
}

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type SignupResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func (h *AuthHandler) Signup(c echo.Context) error {
	var req SignupRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request").
			WithInternal(fmt.Errorf("c.Bind: %w", err))
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email, password, and name are required")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to hash password").
			WithInternal(fmt.Errorf("bcrypt.GenerateFromPassword: %w", err))
	}

	merchant, err := h.queries.CreateMerchant(c.Request().Context(), sqlcgen.CreateMerchantParams{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return echo.NewHTTPError(http.StatusConflict, "email already registered").
				WithInternal(fmt.Errorf("queries.CreateMerchant: %w", err))
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create merchant").
			WithInternal(fmt.Errorf("queries.CreateMerchant: %w", err))
	}

	return c.JSON(http.StatusCreated, SignupResponse{
		ID:    merchant.ID.String(),
		Email: merchant.Email,
		Name:  merchant.Name,
	})
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	MerchantID string `json:"merchant_id"`
	Email      string `json:"email"`
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request").
			WithInternal(fmt.Errorf("c.Bind: %w", err))
	}

	if req.Email == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email and password are required")
	}

	merchant, err := h.queries.GetMerchantByEmail(c.Request().Context(), req.Email)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials").
			WithInternal(fmt.Errorf("queries.GetMerchantByEmail: %w", err))
	}

	if err := bcrypt.CompareHashAndPassword([]byte(merchant.PasswordHash), []byte(req.Password)); err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials").
			WithInternal(fmt.Errorf("bcrypt.CompareHashAndPassword: %w", err))
	}

	merchantID := merchant.ID.String()

	claims := jwt.MapClaims{
		"merchant_id": merchantID,
		"email":       merchant.Email,
		"exp":         time.Now().Add(TOKEN_MAX_AGE).Unix(),
		"iat":         time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate token").
			WithInternal(fmt.Errorf("token.SignedString: %w", err))
	}

	c.SetCookie(&http.Cookie{
		Name:     TOKEN_COOKIE_NAME,
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(TOKEN_MAX_AGE.Seconds()),
	})

	return c.JSON(http.StatusOK, LoginResponse{
		MerchantID: merchantID,
		Email:      merchant.Email,
	})
}

func (h *AuthHandler) Logout(c echo.Context) error {
	c.SetCookie(&http.Cookie{
		Name:     TOKEN_COOKIE_NAME,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	return c.NoContent(http.StatusNoContent)
}

type MeResponse struct {
	MerchantID string `json:"merchant_id"`
	Email      string `json:"email"`
}

func (h *AuthHandler) Me(c echo.Context) error {
	return c.JSON(http.StatusOK, MeResponse{
		MerchantID: c.Get("merchant_id").(string),
		Email:      c.Get("email").(string),
	})
}
