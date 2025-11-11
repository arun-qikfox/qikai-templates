import type { Message } from './types';

export const createMessage = (role: 'user' | 'assistant', content: string, toolCalls?: any[]): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: Date.now(),
  ...(toolCalls && { toolCalls })
});