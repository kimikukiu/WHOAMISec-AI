export class Message {
  async send(params: any): Promise<any> {
    const { content, type = 'info', attachments = [] } = params;
    console.log(`[MESSAGE] Sending ${type}: ${content.substring(0, 50)}...`);
    
    return {
      success: true,
      type,
      content,
      attachments,
      timestamp: Date.now(),
      delivered: true
    };
  }

  async ask(params: any): Promise<any> {
    const { question, options = [] } = params;
    return {
      success: true,
      question,
      options,
      type: 'ask',
      requiresResponse: true
    };
  }

  help(): string {
    return `Message tool - communicate with user.
Methods: send({content, type?: 'info'|'ask'|'result', attachments?}), ask({question, options?})`;
  }
}

export default Message;
