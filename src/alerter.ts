import { DynamoDBStreamEvent, DynamoDBStreamHandler, DynamoDBRecord } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();
const sns = new SNSClient({});
const topicArn = process.env.TOPIC_ARN!;
const tableName = process.env.TABLE_NAME!;

export const getChangedFields = (oldImage: Record<string, unknown>, newImage: Record<string, unknown>) => {
  const changed = { before: {} as Record<string, unknown>, after: {} as Record<string, unknown> };
  
  for (const key in newImage) {
    if (JSON.stringify(oldImage[key]) !== JSON.stringify(newImage[key])) {
      changed.before[key] = oldImage[key];
      changed.after[key] = newImage[key];
    }
  }
  
  return changed;
};

export const buildMessage = (record: DynamoDBRecord): string => {
  const eventName = record.eventName;
  const keys = record.dynamodb?.Keys ? JSON.stringify(record.dynamodb.Keys) : 'N/A';
  
  let message = `*${tableName}* table - *${eventName}* event\nKeys: ${keys}`;
  
  if (eventName === 'MODIFY' && record.dynamodb?.OldImage && record.dynamodb?.NewImage) {
    const changed = getChangedFields(record.dynamodb.OldImage, record.dynamodb.NewImage);
    message += `\n*Before:* ${JSON.stringify(changed.before)}`;
    message += `\n*After:* ${JSON.stringify(changed.after)}`;
  } else if (eventName === 'INSERT' && record.dynamodb?.NewImage) {
    message += `\n*Data:* ${JSON.stringify(record.dynamodb.NewImage)}`;
  } else if (eventName === 'REMOVE' && record.dynamodb?.OldImage) {
    message += `\n*Data:* ${JSON.stringify(record.dynamodb.OldImage)}`;
  }
  
  return message;
};

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  logger.info('Processing DynamoDB stream event', { recordCount: event.Records.length });
  
  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY' || record.eventName === 'REMOVE') {
      logger.info('Processing record', { 
        eventName: record.eventName, 
        tableName,
      });
      
      const message = buildMessage(record);
      
      try {
        await sns.send(new PublishCommand({
          TopicArn: topicArn,
          Message: message,
          Subject: `${tableName} Table Update Alert`
        }));
        
        logger.info('Alert sent successfully', { eventName: record.eventName });
      } catch (error) {
        logger.error('Failed to send alert', { error, eventName: record.eventName });
        throw error;
      }
    }
  }
};