# Beat Music API

All new endpoints use the `/api/v1` prefix and return `{ success, message, data }`. Send the JWT returned by login as `Authorization: Bearer <token>`, or use the HTTP-only login cookie.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| POST | `/auth/register` | Public | Body: `name`, `email`, `password`, `confirmPassword` |
| POST | `/auth/login` | Public | Body: `email`, `password` |
| POST | `/auth/logout` | Public | Clears cookie |
| GET | `/auth/me` | Authenticated | Current user |
| GET | `/songs?page=1&limit=20&q=&artist=&albumId=&genre=` | Public | Paginated song search |
| GET/POST/PATCH/DELETE | `/songs/:id` | Read public; writes admin | Song CRUD |
| POST | `/songs/:id/play` | Authenticated | Records a play and history |
| POST/DELETE/GET | `/songs/:id/like` | Authenticated | Like management/status |
| GET | `/search?q=&limit=` | Public | Songs (title, artist, genre), artists, albums, public playlists |
| GET | `/home` | Public | Home feed data |
| GET | `/albums`, `/albums/:id` | Public | Album catalog/detail |
| GET | `/artists`, `/artists/:id` | Public | Artist catalog/detail |
| POST/PATCH/DELETE | `/artists/:id`, `/albums/:id` | Admin | Catalog management |
| GET/POST | `/playlists`, `/playlists/:id` | Public reads / auth writes | Playlist catalog and creation |
| PATCH/DELETE | `/playlists/:id` | Owner/admin | Playlist changes |
| POST/DELETE | `/playlists/:id/songs` | Owner/admin | Add or remove songs |
| GET | `/playlists?mine=true` | Authenticated | The caller's own playlists |
| GET | `/library`, `/library/liked`, `/library/recently-played` | Authenticated | Personal library (liked songs newest first) |
| GET | `/genres` | Public | Distinct song genres for browse tiles |
| GET | `/follows` | Authenticated | Artists the caller follows |
| PUT/DELETE | `/follows/artists/:name` | Authenticated | Follow or unfollow an artist |
| POST/GET/DELETE | `/history/:songId`, `/history` | Authenticated | Listening history |
| POST | `/uploads/avatar|song|album-cover|artist-cover` | Admin | Multipart field: `file` (10 MB max) |

## Subscriptions and Razorpay payments

Plans are defined in `src/config/plans.js`. Paid plans can be purchased through Razorpay Checkout (test mode when `RAZORPAY_API_KEY` starts with `rzp_test_`).

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/subscription/plans` | Public | Plan catalog and whether Razorpay is configured |
| GET | `/api/subscription/me` | Authenticated | Current plan, entitlements and payment history |
| POST | `/api/subscription/razorpay/order` | Authenticated | Body: `planId` (`basic`/`premium`/`pro`), `billingCycle` (`monthly`/`yearly`). Returns `keyId`, `orderId`, `amount` (paise) and prefill data |
| POST | `/api/subscription/razorpay/verify` | Authenticated | Body: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` from Checkout. Verifies the HMAC and activates the plan |
| POST | `/api/subscription/razorpay/webhook` | Razorpay | Raw JSON webhook; verifies `x-razorpay-signature` with `RAZORPAY_WEBHOOK_SECRET` |
| POST | `/api/subscription/subscribe` | Authenticated | Demo activation, only when Razorpay is **not** configured |
| POST | `/api/subscription/cancel` | Authenticated | Ends the paid plan immediately |
| GET | `/api/subscription/downloads` | Authenticated | Recent download history |

Set these in `backend/.env`:

```env
RAZORPAY_API_KEY=rzp_test_xxxxxxxxxxxxx
RAZORPAY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
# Optional, only if you configure a webhook URL in the Razorpay dashboard
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

Test-mode checkout accepts UPI/card/netbanking test details from the Razorpay dashboard and never charges real money.

## Podcasts, videos and admin uploads

The admin panel uses the `/api/admin` routes with `Authorization: Bearer <token>` (or the login cookie). Multipart uploads accept files up to `MAX_UPLOAD_MB` (default 100 MB) and are stored on Cloudinary.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/podcast`, `/api/podcast/:id` | Public | Published podcast episodes |
| GET | `/api/video`, `/api/video/:id` | Public | Published videos |
| GET | `/api/admin/podcasts` | Admin | All episodes, including drafts |
| POST/PUT/DELETE | `/api/admin/podcasts`, `/api/admin/podcasts/:id` | Admin | Multipart fields: `title`, `showName`, `audioFile`, `coverFile`, `videoFile`, `thumbnailFile`, `status`, ... |
| GET | `/api/admin/videos` | Admin | All videos, including drafts |
| POST/PUT/DELETE | `/api/admin/videos`, `/api/admin/videos/:id` | Admin | Multipart fields: `title`, `creator`, `videoFile`, `thumbnailFile`, `status`, ... |
| PUT | `/api/admin/songs/:id` | Admin | Edit song metadata and optionally replace `audioFile`, `imageFile`, `videoFile` |
| GET | `/api/admin/overview` | Admin | Recent podcasts/videos and media totals |

Example success response:

```json
{ "success": true, "message": "Songs fetched", "data": [], "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }
```
