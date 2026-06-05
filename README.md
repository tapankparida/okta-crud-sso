# Okta SSO Spring Boot + React CRUD App

This workspace contains a small secured product manager:

- `backend/`: Spring Boot REST API with PostgreSQL, JPA CRUD, validation, CORS, and Okta JWT validation.
- `frontend/`: React + Vite SPA that signs users in through Okta and calls the API with an access token.
- `docker-compose.yml`: PostgreSQL for local development.

## Okta Setup

Create two Okta app integrations.

1. API authorization server
   - Use the default authorization server if available.
   - Issuer format: `https://{yourOktaDomain}/oauth2/default`
   - The backend uses this as `OKTA_ISSUER`.

2. SPA application
   - Platform: Single-Page Application.
   - Sign-in redirect URI: `http://localhost:5173/login/callback`
   - Sign-out redirect URI: `http://localhost:5173`
   - Trusted origin / CORS origin: `http://localhost:5173`
   - Copy the client ID into `frontend/.env`.

## Configure

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit both files with your Okta domain, issuer, and SPA client ID.

## Run PostgreSQL

```bash
docker compose up -d postgres
```

If Docker is not installed, create a local PostgreSQL database with these values:

- Database: `okta_products`
- User: `okta_user`
- Password: `okta_password`

## Run Backend

From `backend/`:

```bash
mvn spring-boot:run
```

The API runs at `http://localhost:8080`.

Protected endpoints:

- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `GET /api/products/me`

Example product payload:

```json
{
  "name": "Starter License",
  "description": "Basic monthly license",
  "price": 29.99
}
```

## Run Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, sign in with Okta, then manage products.

## Security Flow

The React app uses Okta Authorization Code with PKCE. After login, it sends the access token as:

```http
Authorization: Bearer <access-token>
```

Spring Security validates the JWT against the Okta issuer before allowing any CRUD API call.
