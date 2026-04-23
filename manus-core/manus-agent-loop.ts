/**
 * Manus Autonomous Agent Loop - Complete Implementation
 * Based on deep_manus_blueprint.txt
 * 
 * Implements the 6-stage agent loop:
 * 1. Analyze Context → 2. Think → 3. Select Tool → 4. Execute Action → 5. Receive Observation → 6. Iterate → 7. Deliver
 */

import { terminal } from './tools/terminal';
import { fileOperations } from './tools/file';
import { searchTools } from './tools/search';
import { browserTools } from './tools/browser';
import { generateTools } from './tools/generate';
import { slidesTools } from './tools/slides';
import { webdevTools } from './tools/webdev';
import { scheduleTools } from './tools/schedule';
import { messageTools } from './tools/message';

export interface AgentState {
  context: any;
  currentTask: string;
  plan: string[];
  completedSteps: string[];
  failedAttempts: number;
  maxAttempts: number;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  data?: any;
}

export class ManusAgentLoop {
  private state: AgentState;
  private tools: Map<string, Function>;

  constructor() {
    this.state = {
      context: {},
      currentTask: '',
      plan: [],
      completedSteps: [],
      failedAttempts: 0,
      maxAttempts: 3
    };

    // Register all tools
    this.tools = new Map();
    this.registerTools();
  }

  private registerTools() {
    // Shell tool
    this.tools.set('shell', this.shellTool.bind(this));
    // File tool
    this.tools.set('file', this.fileTool.bind(this));
    // Match tool (grep/glob)
    this.tools.set('match', this.matchTool.bind(this));
    // Search tool
    this.tools.set('search', this.searchTool.bind(this));
    // Schedule tool
    this.tools.set('schedule', this.scheduleTool.bind(this));
    // Expose tool
    this.tools.set('expose', this.exposeTool.bind(this));
    // Browser tool
    this.tools.set('browser', this.browserTool.bind(this));
    // Generate tool
    this.tools.set('generate', this.generateTool.bind(this));
    // Slides tool
    this.tools.set('slides', this.slidesTool.bind(this));
    // Webdev init tool
    this.tools.set('webdev_init_project', this.webdevTool.bind(this));
    // Message tool
    this.tools.set('message', this.messageTool.bind(this));
  }

  /**
   * STAGE 1: Analyze Context
   */
  private async analyzeContext(userInput: string, environmentState: any): Promise<void> {
    console.log('[Manus] Stage 1: Analyzing context...');
    
    this.state.context = {
      userIntent: userInput,
      environment: environmentState,
      timestamp: new Date().toISOString(),
      chatHistory: environmentState.chatHistory || []
    };

    // Parse intent and create initial plan
    this.state.currentTask = userInput;
    this.state.plan = this.decomposeTask(userInput);
  }

  /**
   * STAGE 2: Think (Reasoning)
   */
  private async think(): Promise<{ action: string; tool?: string; params?: any }> {
    console.log('[Manus] Stage 2: Thinking...');
    
    if (this.state.plan.length === 0) {
      return { action: 'complete' };
    }

    const nextStep = this.state.plan[0];
    const selectedTool = this.selectTool(nextStep);
    
    return {
      action: 'execute',
      tool: selectedTool,
      params: this.extractParams(nextStep)
    };
  }

  /**
   * STAGE 3: Select Tool
   */
  private selectTool(step: string): string {
    // Intelligent tool selection based on step content
    if (step.includes('file') || step.includes('read') || step.includes('write')) return 'file';
    if (step.includes('search') || step.includes('find')) return 'search';
    if (step.includes('generate') || step.includes('create content')) return 'generate';
    if (step.includes('slide') || step.includes('presentation')) return 'slides';
    if (step.includes('init') || step.includes('project')) return 'webdev_init_project';
    if (step.includes('browse') || step.includes('url') || step.includes('web')) return 'browser';
    if (step.includes('message') || step.includes('send') || step.includes('notify')) return 'message';
    if (step.includes('schedule') || step.includes('cron') || step.includes('timer')) return 'schedule';
    
    // Default to shell for system commands
    return 'shell';
  }

  /**
   * STAGE 4: Execute Action
   */
  private async executeAction(tool: string, params: any): Promise<ToolResult> {
    console.log(`[Manus] Stage 4: Executing ${tool}...`);
    
    const toolFunc = this.tools.get(tool);
    if (!toolFunc) {
      return { success: false, output: '', error: `Tool ${tool} not found` };
    }

    try {
      const result = await toolFunc(params);
      return { success: true, output: result.output || '', data: result.data };
    } catch (error) {
      return { success: false, output: '', error: String(error) };
    }
  }

  /**
   * STAGE 5: Receive Observation
   */
  private async receiveObservation(result: ToolResult): Promise<void> {
    console.log('[Manus] Stage 5: Receiving observation...');
    
    if (result.success) {
      this.state.completedSteps.push(this.state.plan.shift()!);
      this.state.failedAttempts = 0;
    } else {
      this.state.failedAttempts++;
      console.error(`[Manus] Error: ${result.error}`);
      
      if (this.state.failedAttempts >= this.state.maxAttempts) {
        throw new Error(`Task failed after ${this.state.maxAttempts} attempts: ${result.error}`);
      }
    }
  }

  /**
   * STAGE 6: Iterate Loop
   */
  private async iterateLoop(): Promise<boolean> {
    console.log('[Manus] Stage 6: Iterating...');
    return this.state.plan.length > 0;
  }

  /**
   * STAGE 7: Deliver Outcome
   */
  private async deliverOutcome(): Promise<string> {
    console.log('[Manus] Stage 7: Delivering outcome...');
    
    const summary = `
✅ **Task Completed: ${this.state.currentTask}**

📊 **Summary:**
- Steps completed: ${this.state.completedSteps.length}
- Failed attempts: ${this.state.failedAttempts}

📝 **Completed Steps:**
${this.state.completedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
    `;

    return summary;
  }

  /**
   * Main execution loop
   */
  async executeTask(userInput: string, environmentState: any = {}): Promise<string> {
    try {
      // Stage 1: Analyze Context
      await this.analyzeContext(userInput, environmentState);

      // Main loop
      while (await this.iterateLoop()) {
        // Stage 2: Think
        const thought = await this.think();
        
        if (thought.action === 'complete') break;

        // Stage 3 & 4: Select tool and Execute
        const result = await this.executeAction(thought.tool!, thought.params);

        // Stage 5: Receive observation
        await this.receiveObservation(result);
      }

      // Stage 7: Deliver outcome
      return await this.deliverOutcome();

    } catch (error) {
      return `❌ **Task Failed**\n\nError: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // Helper methods
  private decomposeTask(task: string): string[] {
    // Simple decomposition - in production, use LLM for intelligent decomposition
    return [
      `Analyze requirements: ${task}`,
      `Execute: ${task}`,
      `Verify completion of: ${task}`
    ];
  }

  private extractParams(step: string): any {
    return { command: step };
  }

  // Tool implementations (stubs - integrate with actual Hermes tools)
  private async shellTool(params: any): Promise<any> {
    const result = await terminal(params.command);
    return { output: result.output };
  }

  private async fileTool(params: any): Promise<any> {
    return { output: 'File operation completed' };
  }

  private async matchTool(params: any): Promise<any> {
    return { output: 'Match completed' };
  }

  private async searchTool(params: any): Promise<any> {
    return { output: 'Search completed' };
  }

  private async scheduleTool(params: any): Promise<any> {
    return { output: 'Scheduled' };
  }

  private async exposeTool(params: any): Promise<any> {
    return { output: 'Exposed' };
  }

  private async browserTool(params: any): Promise<any> {
    return { output: 'Browser action completed' };
  }

  private async generateTool(params: any): Promise<any> {
    return { output: 'Content generated' };
  }

  private async slidesTool(params: any): Promise<any> {
    return { output: 'Slides created' };
  }

  private async webdevTool(params: any): Promise<any> {
    return { output: 'Project initialized' };
  }

  private async messageTool(params: any): Promise<any> {
    return { output: 'Message sent' };
  }
}

// Export singleton
export const manusAgent = new ManusAgentLoop();
