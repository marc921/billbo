//go:build mage

package main

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/magefile/mage/sh"
)

// TODO: use a cloud-hosted secrets manager when using a real database.
var (
	DATABASE_URL = "postgres://myuser:mypassword@localhost:5432/mydb?sslmode=disable"
	SCHEMA_FILE  = "backend/database/schema.sql"
	JWT_SECRET   = "dev-secret-do-not-use-in-production"
)

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
		"--url", DATABASE_URL,
		"--migrations-dir", "backend/database/migrations",
		"--schema-file", SCHEMA_FILE,
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
		"--url", DATABASE_URL,
		"--migrations-dir", "backend/database/migrations",
		"--schema-file", SCHEMA_FILE,
		"up",
	); err != nil {
		return err
	}
	return sh.Run("sed", "-i", "", `/^\\restrict /d;/^\\unrestrict /d`, SCHEMA_FILE)
}

// DashboardAPI starts the dashboard API server.
func DashboardAPI() error {
	cmd := exec.Command("go", "run", "./backend/cmd/dashboard-api")
	cmd.Env = append(os.Environ(),
		"DATABASE_URL="+DATABASE_URL,
		"JWT_SECRET="+JWT_SECRET,
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// IngestAPI starts the ingest API server.
func IngestAPI() error {
	cmd := exec.Command("go", "run", "./backend/cmd/ingest-api")
	cmd.Env = append(os.Environ(),
		"DATABASE_URL="+DATABASE_URL,
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Frontend starts the frontend dev server.
func Frontend() error {
	return sh.RunV("npm", "--prefix", "frontend", "run", "dev")
}

// Generate runs sqlc code generation.
func Generate() error {
	return sh.RunV("go", "generate", "./...")
}
