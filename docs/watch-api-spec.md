# Galaxy Watch Quick Expense API

Backend contract for the separate Wear OS app. Use the deployed NoriNote HTTPS origin as the base URL. All four requests below send `Authorization: Bearer <watch-token>`. The watch does not use the web password or session cookie.

## Set up the watch token

1. On the backend, run `node scripts/create-watch-token.js`.
2. Set its `WATCH_TOKEN_SHA256` output as a server environment variable and deploy.
3. Transfer the raw token to the watch once. Encrypt it at rest with an Android Keystore-backed key; send it only over HTTPS.

Only one watch token is active at a time. Generating a new token and replacing `WATCH_TOKEN_SHA256` revokes the old one. No pairing or token-transfer endpoint is implemented in this repository. The web login separately requires `SITE_PASSWORD` and a random `SESSION_SECRET` (for example, generate the latter with `openssl rand -hex 32`).

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/nori/category` | Choose an expense category and optional subcategory. |
| `GET` | `/api/nori/method` | Choose a payment method. |
| `GET` | `/api/nori/daily-average` | Show `dailyAverage` and `totalSpent`. |
| `POST` | `/api/nori/transaction` | Save an expense. |

The watch token is accepted for exactly these method/path pairs. It does not authorize other protected NoriNote routes.

### `GET /api/nori/category`

Returns a JSON array of category records. Use records with `type: "expense"`. Fields needed by the watch: `_id` (string to send as `category`), `name`, `type`, and `subcategories` (array of `{ _id, name }`). `icon` and `order` are also returned.

### `GET /api/nori/method`

Returns a JSON array of payment method records. Fields needed by the watch: `_id` (string to send as `paymentMethod`) and `name`. `icon`, `color`, `desc`, and `order` are also returned.

### `GET /api/nori/daily-average`

Without query parameters, uses the current 30th–29th spending cycle in `Asia/Bangkok`. In short months the boundary is clamped to the last day. To request another period, provide **both** `startDate` and `endDate` as ISO 8601 timestamps. A missing partner, invalid date, or reversed range returns `400`.

Response fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `dailyAverage` | number | Spending in the configured daily-average categories divided by elapsed days in the period. |
| `totalSpent` | number | Sum of **all** expense transactions in the period, expressed as a positive number; matches the dashboard total-spent card. |
| `elapsedDays` | number | Days used as the daily-average divisor. |
| `todayUsage` | number | Today's spending in the configured daily-average categories. |
| `selectedCategories` | string[] | Category IDs included in the daily-average calculation. |
| `breakdown` | object[] | Per-category daily averages. |

`dailyAverage` and `totalSpent` can cover different category sets. Display the values returned by the API; do not derive one from the other.

### `POST /api/nori/transaction`

Send `Content-Type: application/json` and a body like:

```json
{
  "name": "Lunch",
  "category": "<category _id from GET /category>",
  "subCategory": "<optional subcategory _id>",
  "amount": -120,
  "date": "2026-09-24T12:30:00+07:00",
  "paymentMethod": "<method _id from GET /method>"
}
```

`name`, `category`, `amount`, `date`, and `paymentMethod` are required; `subCategory` is optional. Expense amounts are negative numbers. If the watch has no name input, use the chosen category name. Send an ISO 8601 timestamp with a timezone offset so the intended local time is unambiguous.

Success is `201` with the saved transaction JSON, including `_id`. Refetch `GET /api/nori/daily-average` after success to update the two displayed metrics. The endpoint has no idempotency key; an automatic retry after an uncertain timeout can create a duplicate expense.

## Errors and current limits

- Missing or invalid watch token: `401 { "error": "Unauthorized" }`.
- Missing required transaction fields: `400 { "error": "Missing required fields" }`.
- Invalid daily-average date range: `400` with an `error` string.
- Database or transaction validation failure: `500` with an `error` string; transaction errors may also include `details`.

The backend does not yet validate that a transaction's category and payment method IDs exist or that an expense amount is negative. The watch must send values from the two GET responses and a negative amount.
