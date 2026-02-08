package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"billbo.com/backend/api"
	"billbo.com/backend/api/dashboard/apikeys"
	"billbo.com/backend/api/dashboard/auth"
	"billbo.com/backend/api/dashboard/events"
	"billbo.com/backend/api/dashboard/skus"
	"billbo.com/backend/database"
	"billbo.com/backend/database/sqlcgen"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger, err := zap.NewDevelopment()
	if err != nil {
		zap.L().Fatal("zap.NewDevelopment", zap.Error(err))
	}

	go OnSignal(cancel, logger)

	// Config
	cfg, err := NewConfig(ctx)
	if err != nil {
		logger.Fatal("NewConfig", zap.Error(err))
	}

	// Database
	pool, err := database.NewPostgresPool(cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("database.NewPostgresPool", zap.Error(err))
	}
	defer pool.Close()
	queries := sqlcgen.New(pool)

	// Echo instance
	e := echo.New()
	e.Binder = api.NewValidatingBinder()

	e.Pre(middleware.RemoveTrailingSlash())
	e.Use(middleware.RequestLogger())
	e.Debug = true

	// API
	v1 := e.Group("/api/v1")

	// Auth API
	authHandler := auth.NewAuthHandler(logger, queries, []byte(cfg.JWTSecret))
	authHandler.Routes(v1.Group("/auth"))

	// Events API
	eventHandler := events.NewEventHandler(logger, queries)
	eventsGroup := v1.Group("/events", auth.JWTMiddleware([]byte(cfg.JWTSecret)))
	eventHandler.Routes(eventsGroup)

	// API Keys API
	apiKeyHandler := apikeys.NewAPIKeyHandler(logger, queries)
	apiKeysGroup := v1.Group("/api-keys", auth.JWTMiddleware([]byte(cfg.JWTSecret)))
	apiKeyHandler.Routes(apiKeysGroup)

	// SKUs API
	skuHandler := skus.NewSKUHandler(logger, queries)
	skusGroup := v1.Group("/skus", auth.JWTMiddleware([]byte(cfg.JWTSecret)))
	skuHandler.Routes(skusGroup)

	// Start server
	errGrp, ctx := errgroup.WithContext(ctx)

	errGrp.Go(func() error {
		err := e.Start("localhost:" + fmt.Sprint(cfg.Port))
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("e.Start: %w", err)
		}
		return nil
	})

	errGrp.Go(func() error {
		<-ctx.Done()
		gracePeriod := time.Minute
		logger.Info("shutting down echo server", zap.Duration("grace_period", gracePeriod))
		shutdownCtx, cancel := context.WithTimeout(context.Background(), gracePeriod)
		defer cancel()
		err := e.Shutdown(shutdownCtx)
		if err != nil {
			return fmt.Errorf("server shutdown: %w", err)
		}
		return nil
	})

	err = errGrp.Wait()
	if err != nil {
		if errors.Is(err, context.Canceled) {
			logger.Info("shutting down")
			return
		}
		logger.Fatal("errGrp.Wait", zap.Error(err))
	}
}

func OnSignal(f func(), logger *zap.Logger) {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigs
	logger.Info("signal received", zap.String("signal", sig.String()))
	f()
}
