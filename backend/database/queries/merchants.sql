-- name: CreateMerchant :one
INSERT INTO merchants (email, password_hash, name)
VALUES ($1, $2, $3)
RETURNING id, email, name, created_at, updated_at;

-- name: GetMerchantByEmail :one
SELECT id, email, password_hash, name, created_at, updated_at
FROM merchants
WHERE email = $1;

-- name: GetMerchantByID :one
SELECT id, email, name, created_at, updated_at
FROM merchants
WHERE id = $1;
