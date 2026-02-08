package main

import (
	"context"
	"fmt"

	"github.com/sethvargo/go-envconfig"
)

type Config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
	JWTSecret   string `env:"JWT_SECRET,required"`
	Port        int    `env:"PORT,default=8080"`
}

func NewConfig(ctx context.Context) (Config, error) {
	var cfg Config
	if err := envconfig.Process(ctx, &cfg); err != nil {
		return Config{}, fmt.Errorf("NewConfig: %w", err)
	}
	return cfg, nil
}
