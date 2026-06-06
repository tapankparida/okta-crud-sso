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

## Environments

This project is configured for two environments:

- `local`: runs on your laptop with local PostgreSQL, React on `localhost:5173`, and Spring Boot on `localhost:8080`.
- `prod`: runs in AWS with managed PostgreSQL, HTTPS domains, and AWS-managed environment variables/secrets.

Do not commit real `.env` files. Commit only the example templates.

### Backend Environment Files

Local template:

```bash
cp backend/.env.local.example backend/.env
```

Production template:

```bash
cp backend/.env.prod.example backend/.env.prod
```

For AWS production, prefer storing these values directly in the AWS service configuration instead of uploading `.env.prod`.

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

For prod, use:

```env
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/okta_products
APP_CORS_ALLOWED_ORIGINS=https://<frontend-domain>
OKTA_ISSUER=https://<okta-domain>/oauth2/default
```

### Frontend Environment Files

Local template:

```bash
cp frontend/.env.local.example frontend/.env
```

Production template:

```bash
cp frontend/.env.prod.example frontend/.env.prod
```

For AWS Amplify or another frontend build service, set these as build environment variables.

Required frontend variables:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_OKTA_ISSUER=https://trial-6559770.okta.com/oauth2/default
VITE_OKTA_CLIENT_ID=<okta-spa-client-id>
VITE_OKTA_REDIRECT_URI=http://localhost:5173/login/callback
```

For prod, use:

```env
VITE_API_BASE_URL=https://<api-domain>/api
VITE_OKTA_REDIRECT_URI=https://<frontend-domain>/login/callback
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
npm run dev:local
```

Open `http://localhost:5173`, sign in with Okta, then manage products.

## Build For AWS Production

### Backend

Build the Spring Boot jar:

```bash
cd backend
mvn clean package
```

Recommended AWS runtime options:

- AWS App Runner with the backend `Dockerfile`
- ECS Fargate with the backend `Dockerfile`
- Elastic Beanstalk with the packaged jar

Set backend production environment variables in AWS:

```env
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/okta_products
SPRING_DATASOURCE_USERNAME=<prod-db-user>
SPRING_DATASOURCE_PASSWORD=<secret>
APP_CORS_ALLOWED_ORIGINS=https://<frontend-domain>
OKTA_ISSUER=https://<okta-domain>/oauth2/default
```

### Frontend

Build the React app:

```bash
cd frontend
npm install
npm run build:prod
```

Recommended AWS hosting options:

- AWS Amplify Hosting
- S3 + CloudFront

Set frontend production build variables in AWS:

```env
VITE_API_BASE_URL=https://<api-domain>/api
VITE_OKTA_ISSUER=https://<okta-domain>/oauth2/default
VITE_OKTA_CLIENT_ID=<prod-okta-spa-client-id>
VITE_OKTA_REDIRECT_URI=https://<frontend-domain>/login/callback
```

## Okta Production URLs

For production, update your Okta SPA app with:

```text
Sign-in redirect URI: https://<frontend-domain>/login/callback
Sign-out redirect URI: https://<frontend-domain>
Trusted Origin: https://<frontend-domain>
```

If you use a separate prod Okta app, copy its client ID into `VITE_OKTA_CLIENT_ID`.

## Security Flow

The React app uses Okta Authorization Code with PKCE. After login, it sends the access token as:

```http
Authorization: Bearer <access-token>
```

Spring Security validates the JWT against the Okta issuer before allowing any CRUD API call.
