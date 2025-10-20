#!/bin/sh
set -e

# Deploy prerequisites stack
sam deploy --template-file infra/prerequisites.yaml --stack-name dynamo-alerts-prerequisites --capabilities CAPABILITY_IAM

# Get outputs from prerequisites stack
STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name dynamo-alerts-prerequisites --query "Stacks[0].Outputs" --output json)
TABLE_STREAM_ARN=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="TableStreamArn") | .OutputValue')
TOPIC_ARN=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="TopicArn") | .OutputValue')
TABLE_NAME=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="TableName") | .OutputValue')
ENCRYPTION_KEY_ARN=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="EncryptionKeyArn") | .OutputValue')

# Deploy alerter stack
sam deploy --template-file infra/alerter.yaml --stack-name dynamo-alerts-alerter --capabilities CAPABILITY_IAM --parameter-overrides TableStreamArn=$TABLE_STREAM_ARN TopicArn=$TOPIC_ARN TableName=$TABLE_NAME EncryptionKeyArn=$ENCRYPTION_KEY_ARN