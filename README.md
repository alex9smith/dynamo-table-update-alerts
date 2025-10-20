# DynamoDB table update alerts

This is an AWS SAM application which posts update messages to an SNS topic when a change is made to the items in a DynamoDB table.

It's designed to provide reactive monitoring for infrequently modified tables with critical data.
It's deployed separately to the application stack that owns the target table, and takes the table stream and SNS topic as parameters. This allows it to fit in with other sources of alerts (eg. Cloudwatch) and should mean it has minimal setup effort.

## Deploying

The repo contains two Cloudformation templates in the `infra/` folder.

`prerequisites.yaml` mimics an application and monitoring stack and deploys a DynamoDB table, table stream and SNS topic. For a real-world use case you'd instead reference your application table and monitoring SNS topic.

`alerter.yaml` deploys the alerting stack.
