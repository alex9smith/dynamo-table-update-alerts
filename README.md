# DynamoDB table update alerts

This is an AWS SAM application which posts update messages to an SNS topic when a change is made to the items in a DynamoDB table.

It's designed to provide reactive monitoring for infrequently modified tables with critical data.
It's deployed separately to the application stack that owns the target table, and takes the table stream and SNS topic as parameters. This allows it to fit in with other sources of alerts (eg. Cloudwatch) and should mean it has minimal setup effort.

## Deploying

The repo contains two Cloudformation templates in the `infra/` folder.

`prerequisites.yaml` mimics an application and monitoring stack and deploys a DynamoDB table, table stream and SNS topic. For a real-world use case you'd instead reference your application table and monitoring SNS topic.

`alerter.yaml` deploys the alerting stack.

### Quick deployment

Run the deployment script to deploy both stacks:

```bash
./deploy.sh
```

This will:
1. Deploy the prerequisites stack with a DynamoDB table and SNS topic
2. Extract the table stream ARN, topic ARN, and table name from the stack outputs
3. Deploy the alerter stack with the Lambda function that monitors the table stream

### Manual deployment

Alternatively, deploy each stack individually:

```bash
# Deploy prerequisites
sam deploy --template-file infra/prerequisites.yaml --stack-name dynamo-alerts-prerequisites --capabilities CAPABILITY_IAM

# Deploy alerter (replace values with actual outputs from prerequisites stack)
sam deploy --template-file infra/alerter.yaml --stack-name dynamo-alerts-alerter --capabilities CAPABILITY_IAM --parameter-overrides TableStreamArn=<stream-arn> TopicArn=<topic-arn> TableName=<table-name>
```

### Requirements

- AWS SAM CLI
- AWS CLI configured with appropriate permissions
- `jq` (for the deployment script)
