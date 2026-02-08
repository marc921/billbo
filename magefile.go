//go:build mage

package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"github.com/joho/godotenv"
	"github.com/magefile/mage/sh"
	"github.com/sethvargo/go-envconfig"
)

type Secrets struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
	JWTSecret   string `env:"JWT_SECRET,required"`
}

type Config struct {
	SchemaFile    string `env:"SCHEMA_FILE,default=backend/database/schema.sql"`
	MigrationsDir string `env:"MIGRATIONS_DIR,default=backend/database/migrations"`
}

var secrets Secrets
var config Config

func init() {
	// Load secrets from secrets.env into the process environment.
	// Variables already set in the environment take precedence.
	godotenv.Load("secrets.env")

	if err := envconfig.Process(context.Background(), &secrets); err != nil {
		panic(fmt.Sprintf("init: %v", err))
	}
	if err := envconfig.Process(context.Background(), &config); err != nil {
		panic(fmt.Sprintf("init: %v", err))
	}
}

// StartDB starts the postgres container and runs migrations.
func StartDB() error {
	if err := sh.RunV("docker", "compose", "up", "-d", "postgres"); err != nil {
		return err
	}
	fmt.Println("Waiting for postgres to be ready...")
	if err := sh.RunV("docker", "exec", "billbo-postgres-1",
		"sh", "-c", "until pg_isready -U myuser -d mydb; do sleep 1; done",
	); err != nil {
		return err
	}
	return dbmateUp()
}

// StopDB stops the postgres container.
func StopDB() error {
	return sh.RunV("docker", "compose", "down")
}

// ResetDB drops and recreates the database, then runs migrations.
func ResetDB() error {
	if err := sh.RunV("dbmate",
		"--url", secrets.DatabaseURL,
		"--migrations-dir", config.MigrationsDir,
		"--schema-file", config.SchemaFile,
		"drop",
	); err != nil {
		return err
	}
	return dbmateUp()
}

// dbmateUp runs dbmate up and strips \restrict/\unrestrict lines from the
// generated schema file. pg_dump >=17.6 emits these psql meta-commands as a
// security measure, but sqlc cannot parse them.
func dbmateUp() error {
	if err := sh.RunV("dbmate",
		"--url", secrets.DatabaseURL,
		"--migrations-dir", config.MigrationsDir,
		"--schema-file", config.SchemaFile,
		"up",
	); err != nil {
		return err
	}
	return sh.Run("sed", "-i", "", `/^\\restrict /d;/^\\unrestrict /d`, config.SchemaFile)
}

// DashboardAPI starts the dashboard API server.
func DashboardAPI() error {
	cmd := exec.Command("go", "run", "./backend/cmd/dashboard-api")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// IngestAPI starts the ingest API server.
func IngestAPI() error {
	cmd := exec.Command("go", "run", "./backend/cmd/ingest-api")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Frontend starts the frontend dev server.
func Frontend() error {
	return sh.RunV("npm", "--prefix", "frontend", "run", "dev")
}

// Playground sends fake events to the ingest API every 100ms.
func Playground() error {
	cmd := exec.Command("go", "run", "./backend/cmd/playground")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Generate runs sqlc code generation.
func Generate() error {
	return sh.RunV("go", "generate", "./...")
}
