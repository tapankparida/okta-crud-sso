# AWS Deployment

This project now includes **Option 3: CodePipeline defined by CloudFormation**.

The pipeline stack creates the CI/CD pipeline. The pipeline then deploys the app stack, builds the Spring Boot backend, deploys it to Elastic Beanstalk, builds the React frontend, uploads it to S3, and invalidates CloudFront.

## Architecture

- Frontend: S3 private bucket served by CloudFront
- Backend: Elastic Beanstalk running Java / Corretto 21
- Database: Amazon RDS PostgreSQL
- CI/CD: CodePipeline + CodeBuild + CloudFormation
- Source: GitHub through AWS CodeStar Connections
- Region: `us-east-1`

## Files

```text
infra/app.yml                  # RDS, Elastic Beanstalk, S3, CloudFront
infra/pipeline.yml             # CodePipeline, CodeBuild, IAM, artifact bucket
cicd/buildspec-backend.yml     # Maven build + Elastic Beanstalk deployment
cicd/buildspec-frontend.yml    # Vite build + S3/CloudFront deployment
backend/Procfile               # Elastic Beanstalk Java startup command
```

## 1. Prerequisites

Configure AWS CLI locally:

```bash
aws configure
aws sts get-caller-identity
```

Push this project to GitHub. CodePipeline needs a GitHub repository, for example:

```text
your-github-user/okta-crud-sso
```

Create an AWS CodeStar Connection:

1. Open AWS Console.
2. Go to **Developer Tools > Settings > Connections**.
3. Create a GitHub connection.
4. Complete GitHub authorization.
5. Copy the connection ARN.

The ARN looks like:

```text
arn:aws:codestar-connections:us-east-1:<account-id>:connection/<connection-id>
```

## 2. Deploy The Pipeline Stack

From the project root:

```bash
aws cloudformation deploy \
  --stack-name okta-crud-prod-pipeline \
  --template-file infra/pipeline.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubConnectionArn=arn:aws:codestar-connections:us-east-1:<account-id>:connection/<connection-id> \
    FullRepositoryId=<github-owner>/<github-repo> \
    BranchName=main \
    DBUsername=okta_user \
    DBPassword='<strong-prod-db-password>' \
    OktaIssuer=https://trial-6559770.okta.com/oauth2/default \
    OktaClientId=<prod-okta-spa-client-id>
```

This creates the pipeline and starts the first run. The first run creates the app stack named `okta-crud-prod-app`.

## 3. Get The Frontend Domain

After the app stack is created:

```bash
aws cloudformation describe-stacks \
  --stack-name okta-crud-prod-app \
  --query 'Stacks[0].Outputs'
```

Look for:

```text
CloudFrontDomainName
BackendEndpointUrl
```

## 4. Update Okta For Production

In the Okta SPA app, add the CloudFront URL:

```text
Sign-in redirect URI: https://<CloudFrontDomainName>/login/callback
Sign-out redirect URI: https://<CloudFrontDomainName>
Trusted Origin: https://<CloudFrontDomainName>
```

If you use a separate production Okta SPA app, pass that production client ID as `OktaClientId` in the pipeline stack.

## 5. Re-run The Pipeline

After Okta is updated, re-run the pipeline or push a new commit to `main`.

```bash
aws codepipeline start-pipeline-execution \
  --name okta-crud-prod-pipeline
```

## What The Pipeline Does

1. Pulls source from GitHub.
2. Deploys `infra/app.yml` through CloudFormation.
3. Runs `cicd/buildspec-backend.yml`.
4. Packages the Spring Boot jar and `Procfile`.
5. Creates a new Elastic Beanstalk application version.
6. Updates the Elastic Beanstalk environment.
7. Runs `cicd/buildspec-frontend.yml`.
8. Builds React with production Vite variables.
9. Uploads `frontend/dist` to S3.
10. Invalidates CloudFront.

## Production Notes

The current CloudFormation is intentionally simple for the first production deployment:

- It assumes the AWS account has a default VPC and default database subnet group.
- The backend is exposed through the Elastic Beanstalk endpoint.
- CloudFront serves the frontend over HTTPS.
- RDS is private and only allows access from the Elastic Beanstalk security group.
- RDS and S3 buckets are retained by default so accidental stack deletion does not immediately delete data.

For a stronger production setup, add a custom domain, ACM certificates, HTTPS on the backend load balancer, Secrets Manager for database credentials, explicit VPC/subnets, and least-privilege IAM policies.

## Cost Reminder

This creates billable AWS resources, especially RDS, Elastic Beanstalk/EC2, CloudFront, CodeBuild, CodePipeline, and S3.
