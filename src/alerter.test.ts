import { vi, describe, beforeEach, it, expect } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => ({
    send: mockSend
  })),
  PublishCommand: vi.fn((params) => params)
}));

describe('alerter', () => {
  let handler: any;
  let buildMessage: any;
  let getChangedFields: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    process.env.TABLE_NAME = 'test-table';
    const module = await import('./alerter.js');
    handler = module.handler;
    buildMessage = module.buildMessage;
    getChangedFields = module.getChangedFields;
  });

  describe('getChangedFields', () => {
    it('should return only changed fields', () => {
      const oldImage = { id: { S: '123' }, name: { S: 'old' }, status: { S: 'active' } };
      const newImage = { id: { S: '123' }, name: { S: 'new' }, status: { S: 'active' } };

      const result = getChangedFields(oldImage, newImage);

      expect(result.before).toEqual({ name: { S: 'old' } });
      expect(result.after).toEqual({ name: { S: 'new' } });
    });
  });

  describe('buildMessage', () => {
    it('should format INSERT event', () => {
      const record = {
        eventName: 'INSERT',
        dynamodb: {
          Keys: { id: { S: '123' } },
          NewImage: { id: { S: '123' }, name: { S: 'test' } }
        }
      };

      const result = buildMessage(record);
      expect(result).toContain('*test-table* table - *INSERT* event');
      expect(result).toContain('*Data:*');
    });

    it('should format MODIFY event with only changed fields', () => {
      const record = {
        eventName: 'MODIFY',
        dynamodb: {
          Keys: { id: { S: '123' } },
          OldImage: { id: { S: '123' }, name: { S: 'old' }, status: { S: 'active' } },
          NewImage: { id: { S: '123' }, name: { S: 'new' }, status: { S: 'active' } }
        }
      };

      const result = buildMessage(record);
      expect(result).toContain('*test-table* table - *MODIFY* event');
      expect(result).toContain('*Before:*');
      expect(result).toContain('*After:*');
      expect(result).toContain('"name"');
      expect(result).not.toContain('"status"');
    });
  });

  describe('handler', () => {
    it('should send SNS notification for INSERT event', async () => {
      const event = {
        Records: [{
          eventName: 'INSERT',
          dynamodb: { Keys: { id: { S: '123' } } },
          eventSource: 'aws:dynamodb'
        }]
      } as any;

      await handler(event);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});