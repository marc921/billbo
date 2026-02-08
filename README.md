# BillBo - Usage-Based Billing Engine API

Welcome to this new product, where everything is still to be built, by us!
The goal is to create an API-first SaaS that offloads the pain of making customers pay from engineering teams.
We want to create an API that ingests usage events, applies pricing tiers/rules, and outputs invoices or integrates with a payment service (e.g. Stripe). 

Lexicon:
- BillBo is our product. We are The BillBo Company.
- BillBo users are called Merchants. A merchant is an entire organization, defined by a single paying account. Merchant orgs can have multiple seats/users.
- (End) Users of the Merchants are called Customers. As well, a customer is an organization containing users.
- SKU (Stock Keeping Unit): unique identifier that relates to specific Merchant product information, unit and price per unit

The core of the product is an API that intakes data points such as:
```
{
  merchant_id: uuid,
  customer_id: uuid,
  sku_id: uuid,
  amount: float64,
  sent_at: timestamp,
}
```
and stores them in a database.

# Technical stack

## Backend
Main language: Go
Web framework: [Echo](https://echo.labstack.com/)
Logging: [zap](https://github.com/uber-go/zap)
Database:
- postgresql 
- [dbmate](https://github.com/amacneil/dbmate) to handle migrations
- [sqlc](https://sqlc.dev/) to generate Go code from SQL queries
Job queue / background workflows: [Temporal](https://temporal.io/)
Local commands: [mage](https://magefile.org/)
Loading env variables into a config struct in Go code: [go-envconfig](https://github.com/sethvargo/go-envconfig)

## Frontend
Main language: React / Typescript
Style: Tailwind CSS
Deployment: Vercel