//go:build mage

package main

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/magefile/mage/sh"
)

var databaseURL = "postgres://myuser:mypassword@localhost:5432/mydb?sslmode=disable"

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
	return sh.RunV("dbmate",
		"--url", databaseURL,
		"--migrations-dir", "backend/database/migrations",
		"--schema-file", "backend/database/schema.sql",
		"up",
	)
}

// StopDB stops the postgres container.
func StopDB() error {
	return sh.RunV("docker", "compose", "down")
}

// ResetDB drops and recreates the database, then runs migrations.
func ResetDB() error {
	if err := sh.RunV("dbmate",
		"--url", databaseURL,
		"--migrations-dir", "backend/database/migrations",
		"--schema-file", "backend/database/schema.sql",
		"drop",
	); err != nil {
		return err
	}
	return sh.RunV("dbmate",
		"--url", databaseURL,
		"--migrations-dir", "backend/database/migrations",
		"--schema-file", "backend/database/schema.sql",
		"up",
	)
}

// IngestAPI starts the ingest API server.
func IngestAPI() error {
	cmd := exec.Command("go", "run", "./backend/cmd/ingest-api")
	cmd.Env = append(os.Environ(), "DATABASE_URL="+databaseURL)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Generate runs sqlc code generation.
func Generate() error {
	return sh.RunV("go", "generate", "./...")
}
