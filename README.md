# Okta SSO Spring Boot + React CRUD App

This workspace contains a local product manager application:

- `backend/`: Spring Boot REST API with PostgreSQL, JPA CRUD, validation, CORS, and Okta JWT validation.
- `frontend/`: React + Vite SPA that signs users in through Okta and calls the API with an access token.
- `docker-compose.yml`: PostgreSQL for local development.

## Okta Setup

Create or use an Okta SPA app integration.

- Platform: Single-Page Application
- Sign-in redirect URI: `http://localhost:5173/login/callback`
- Sign-out redirect URI: `http://localhost:5173`
- Trusted origin / CORS origin: `http://localhost:5173`
- Issuer format: `https://{yourOktaDomain}/oauth2/default`

The frontend uses the SPA client ID. The backend uses the issuer to validate access tokens.

## Environment Files

This project is local-only. Do not commit real `.env` files; commit only the example templates.

Backend:

```bash
cp backend/.env.example backend/.env
```

Required backend variables:

```env
SPRING_PROFILES_ACTIVE=local
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/okta_products
SPRING_DATASOURCE_USERNAME=okta_user
SPRING_DATASOURCE_PASSWORD=okta_password
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
OKTA_ISSUER=https://trial-6559770.okta.com/oauth2/default
```

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

Required frontend variables:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_OKTA_ISSUER=https://trial-6559770.okta.com/oauth2/default
VITE_OKTA_CLIENT_ID=<okta-spa-client-id>
VITE_OKTA_REDIRECT_URI=http://localhost:5173/login/callback
```

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
set -a
source .env
set +a
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

## Local Build

Backend:

```bash
cd backend
mvn clean package
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

## Security Flow

The React app uses Okta Authorization Code with PKCE. After login, it sends the access token as:

```http
Authorization: Bearer <access-token>
```

Spring Security validates the JWT against the Okta issuer before allowing any CRUD API call.
