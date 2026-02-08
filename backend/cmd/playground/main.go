package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"billbo.com/backend/database"
	"billbo.com/backend/database/sqlcgen"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"
	"github.com/sethvargo/go-envconfig"
)

type Config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
}

type Event struct {
	CustomerID uuid.UUID `json:"customer_id"`
	SKU_ID     uuid.UUID `json:"sku_id"`
	Amount     float64   `json:"amount"`
	SentAt     time.Time `json:"sent_at"`
}

func main() {
	ctx := context.Background()

	// Load config
	godotenv.Load("secrets.env")
	var cfg Config
	if err := envconfig.Process(ctx, &cfg); err != nil {
		log.Fatalf("config: %v", err)
	}

	// Connect to DB
	pool, err := database.NewPostgresPool(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()
	queries := sqlcgen.New(pool)

	// Fetch first merchant
	var merchantID pgtype.UUID
	err = pool.QueryRow(ctx, "SELECT id FROM merchants LIMIT 1").Scan(&merchantID)
	if err != nil {
		log.Fatalf("no merchant found: %v", err)
	}
	fmt.Printf("using merchant %s\n", merchantID.String())

	// Fetch SKUs for this merchant
	skus, err := queries.ListSKUsByMerchantID(ctx, merchantID)
	if err != nil {
		log.Fatalf("list SKUs: %v", err)
	}
	if len(skus) == 0 {
		log.Fatal("no SKUs found for this merchant")
	}
	skuIDs := make([]uuid.UUID, len(skus))
	for i, sku := range skus {
		skuIDs[i] = uuid.UUID(sku.ID.Bytes)
		fmt.Printf("  sku: %s (%s)\n", sku.Name, sku.ID.String())
	}

	// Create a temporary API key
	rawKey, err := generateAPIKey()
	if err != nil {
		log.Fatalf("generate API key: %v", err)
	}
	keyHash := hashKey(rawKey)
	keyPrefix := rawKey[:11]

	apiKey, err := queries.CreateAPIKey(ctx, sqlcgen.CreateAPIKeyParams{
		MerchantID: merchantID,
		Name:       "playground-temp",
		KeyPrefix:  keyPrefix,
		KeyHash:    keyHash,
	})
	if err != nil {
		log.Fatalf("create API key: %v", err)
	}
	fmt.Printf("created temp API key %s\n", keyPrefix)

	// Revoke the temp key on exit
	defer func() {
		err := queries.RevokeAPIKey(ctx, sqlcgen.RevokeAPIKeyParams{
			ID:         apiKey.ID,
			MerchantID: merchantID,
		})
		if err != nil {
			log.Printf("warning: failed to revoke temp API key: %v", err)
		} else {
			fmt.Println("revoked temp API key")
		}
	}()

	// Start with a single customer, grow over time
	customers := []uuid.UUID{uuid.New()}

	// Send events one per second until interrupted
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	fmt.Println("sending events every 300ms (ctrl+C to stop)...")
	i := 0
	for {
		select {
		case <-sig:
			fmt.Printf("\nstopped after %d events\n", i)
			return
		default:
		}

		// Pick an existing customer or create a new one
		ci := randIntn(min(15, len(customers)+1))
		if ci == len(customers) {
			customers = append(customers, uuid.New())
		}

		event := Event{
			CustomerID: customers[ci],
			SKU_ID:     skuIDs[randIntn(len(skuIDs))],
			Amount:     float64(randIntn(10000)) / 100.0,
			SentAt:     time.Now(),
		}

		body, err := json.Marshal(event)
		if err != nil {
			log.Fatal(err)
		}

		req, err := http.NewRequest("POST", "http://localhost:9876/api/v1/events/", bytes.NewReader(body))
		if err != nil {
			log.Fatalf("event %d: %v", i, err)
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+rawKey)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			log.Fatalf("event %d: %v", i, err)
		}
		resp.Body.Close()

		i++
		fmt.Printf("sent event %d: status %d, sku=%s, amount=%.2f\n",
			i, resp.StatusCode, event.SKU_ID, event.Amount)

		time.Sleep(300 * time.Millisecond)
	}
}

func generateAPIKey() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generateAPIKey: %w", err)
	}
	return "bb_" + hex.EncodeToString(b), nil
}

func hashKey(rawKey string) string {
	h := sha256.Sum256([]byte(rawKey))
	return hex.EncodeToString(h[:])
}

func randIntn(n int) int {
	v, _ := rand.Int(rand.Reader, big.NewInt(int64(n)))
	return int(v.Int64())
}
