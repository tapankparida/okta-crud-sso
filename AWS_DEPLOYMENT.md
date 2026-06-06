# AWS Deployment

Target setup:

- Frontend: AWS Amplify Hosting
- Backend: AWS Elastic Beanstalk
- Database: Amazon RDS PostgreSQL
- Region: `us-east-1`

## 1. Configure AWS CLI

Run this locally in your terminal so your secret key is not pasted into chat:

```bash
aws configure
```

Use:

```text
AWS Access Key ID: <your access key>
AWS Secret Access Key: <your secret key>
Default region name: us-east-1
Default output format: json
```

Verify:

```bash
aws sts get-caller-identity
```

## 2. Create RDS PostgreSQL

Create an RDS PostgreSQL database in `us-east-1`.

Use a database name like:

```text
okta_products
```

The backend needs these production variables:

```env
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/okta_products
SPRING_DATASOURCE_USERNAME=<prod-db-user>
SPRING_DATASOURCE_PASSWORD=<prod-db-password>
APP_CORS_ALLOWED_ORIGINS=https://<frontend-domain>
OKTA_ISSUER=https://<okta-domain>/oauth2/default
```

Because prod uses `ddl-auto=validate`, create the `products` table before first backend startup, or add Flyway migrations.

## 3. Deploy Backend To Elastic Beanstalk

From `backend/`:

```bash
mvn clean package
eb init
eb create okta-crud-api-prod
```

When prompted:

- Region: `us-east-1`
- Platform: Java / Corretto 21
- Environment type: Load balanced or single instance

Set production environment variables:

```bash
eb setenv \
  SPRING_PROFILES_ACTIVE=prod \
  SERVER_PORT=8080 \
  SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/okta_products \
  SPRING_DATASOURCE_USERNAME=<prod-db-user> \
  SPRING_DATASOURCE_PASSWORD=<prod-db-password> \
  APP_CORS_ALLOWED_ORIGINS=https://<frontend-domain> \
  OKTA_ISSUER=https://<okta-domain>/oauth2/default
```

Deploy:

```bash
eb deploy
```

Health check endpoint:

```text
/actuator/health
```

## 4. Deploy Frontend To Amplify

In AWS Amplify Hosting:

1. Connect your Git repo.
2. Select the `frontend` app root.
3. Build command:

```bash
npm ci && npm run build:prod
```

4. Output directory:

```text
dist
```

Add Amplify build environment variables:

```env
VITE_API_BASE_URL=https://<elastic-beanstalk-or-api-domain>/api
VITE_OKTA_ISSUER=https://<okta-domain>/oauth2/default
VITE_OKTA_CLIENT_ID=<prod-okta-spa-client-id>
VITE_OKTA_REDIRECT_URI=https://<frontend-domain>/login/callback
```

## 5. Update Okta

In the Okta SPA app:

```text
Sign-in redirect URI: https://<frontend-domain>/login/callback
Sign-out redirect URI: https://<frontend-domain>
Trusted Origin: https://<frontend-domain>
```

If you create a separate prod Okta SPA app, update Amplify's `VITE_OKTA_CLIENT_ID`.
