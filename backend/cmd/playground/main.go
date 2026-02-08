package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type Event struct {
	MerchantID uuid.UUID `json:"merchant_id"`
	CustomerID uuid.UUID `json:"customer_id"`
	SKU_ID     uuid.UUID `json:"sku_id"`
	Amount     float64   `json:"amount"`
	SentAt     time.Time `json:"sent_at"`
}

func main() {
	merchants := []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}
	customers := []uuid.UUID{uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()}
	skus := []uuid.UUID{uuid.New(), uuid.New(), uuid.New(), uuid.New()}

	for i := range 20 {
		event := Event{
			MerchantID: merchants[rand.Intn(len(merchants))],
			CustomerID: customers[rand.Intn(len(customers))],
			SKU_ID:     skus[rand.Intn(len(skus))],
			Amount:     float64(rand.Intn(10000)) / 100.0,
			SentAt:     time.Now().Add(-time.Duration(rand.Intn(72)) * time.Hour),
		}

		body, err := json.Marshal(event)
		if err != nil {
			log.Fatal(err)
		}

		resp, err := http.Post("http://localhost:8080/api/v1/events/", "application/json", bytes.NewReader(body))
		if err != nil {
			log.Fatalf("event %d: %v", i, err)
		}
		resp.Body.Close()

		fmt.Printf("sent event %d: status %d, amount=%.2f\n", i+1, resp.StatusCode, event.Amount)
	}

	fmt.Println("done — GET http://localhost:8080/api/v1/events/ to view them")
}
