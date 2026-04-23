/**
 * Manus Core - Complete Implementation
 * Based on Deep Manus Blueprint (legitimate parts only)
 * 
 * This is a self-contained module that can be integrated into any project
 * WITHOUT breaking existing functionality
 */

// Export all components
export { ManusAgentLoop, manusAgent } from './manus-agent-loop';
export { 
  shellTool, fileTool, matchTool, searchTool, 
  scheduleTool, exposeTool, browserTool, generateTool,
  slidesTool, webdevTool, messageTool, allTools
} from './manus-tools-complete';
export { SkillsManager, skillsManager } from './manus-skills-system';

// ============================================
// MANUS CORE ORCHESTRATOR
// ============================================

import { ManusAgentLoop } from './manus-agent-loop';
import { allTools } from './manus-tools-complete';
import { skillsManager } from './manus-skills-system';

export interface ManusCoreConfig {
  enabledTools?: string[];
  skillsPath?: string;
  maxAttempts?: number;
  sandboxMode?: boolean;
}

export class ManusCore {
  private agent: ManusAgentLoop;
  private tools: any;
  private skills: any;
  private config: ManusCoreConfig;

  constructor(config: ManusCoreConfig = {}) {
    this.config = {
      enabledTools: Object.keys(allTools),
      skillsPath: './skills',
      maxAttempts: 3,
      sandboxMode: true,
      ...config
    };

    // Initialize components
    this.agent = new ManusAgentLoop();
    this.tools = allTools;
    this.skills = skillsManager;

    console.log('[ManusCore] Initialized with tools:', this.config.enabledTools);
  }

  /**
   * Execute a task using the full Manus Agent Loop
   */
  async executeTask(userInput: string, environmentState: any = {}): Promise<string> {
    console.log(`[ManusCore] Executing task: ${userInput}`);
    
    try {
      const result = await this.agent.executeTask(userInput, environmentState);
      return result;
    } catch (error: any) {
      return `❌ ManusCore Error: ${error.message}`;
    }
  }

  /**
   * Execute a single tool directly
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    const tool = (this.tools as any)[toolName];
    if (!tool) {
      return { error: `Tool not found: ${toolName}` };
    }

    try {
      // Map tool name to method
      if (toolName === 'shell' && params.command) {
        return await tool.exec(params.command, params.workdir);
      }
      if (toolName === 'file') {
        if (params.action === 'read') return await tool.read(params.path, params.offset, params.limit);
        if (params.action === 'write') return await tool.write(params.path, params.content);
        if (params.action === 'append') return await tool.append(params.path, params.content);
        if (params.action === 'edit') return await tool.edit(params.path, params.oldString, params.newString);
        if (params.action === 'view') return await tool.view(params.path);
      }
      if (toolName === 'match') {
        if (params.type === 'glob') return await tool.glob(params.pattern, params.directory);
        if (params.type === 'grep') return await tool.grep(params.pattern, params.directory, params.fileGlob);
      }
      if (toolName === 'search') {
        return await tool.search(params.type, params.query, params.options);
      }
      if (toolName === 'schedule') {
        if (params.type === 'cron') return await tool.cron(params.expression, params.task);
        if (params.type === 'interval') return await tool.interval(params.minutes, params.task);
      }
      if (toolName === 'generate') {
        return await tool.generate(params.type, params.prompt, params.options);
      }
      if (toolName === 'slides') {
        if (params.action === 'create') return await tool.create(params.topic, params.mode, params.content);
        if (params.action === 'edit') return await tool.edit(params.presentationId, params.changes);
      }
      if (toolName === 'webdev_init_project') {
        return await tool.init(params.type, params.name, params.options);
      }
      if (toolName === 'message') {
        if (params.action === 'info') return await tool.info(params.message);
        if (params.action === 'ask') return await tool.ask(params.question);
        if (params.action === 'result') return await tool.result(params.message, params.data);
      }
      
      return { error: `Unknown action for tool: ${toolName}` };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Load and execute a skill
   */
  async executeSkill(skillName: string, params: any, context: any): Promise<any> {
    return await this.skills.executeSkill(skillName, params, context);
  }

  /**
   * List available skills
   */
  async listSkills(): Promise<any[]> {
    return await this.skills.listSkills();
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      config: this.config,
      availableTools: Object.keys(this.tools),
      agentState: 'ready'
    };
  }
}

// Export singleton instance
import { ManusAgentLoop as AgentLoop } from './manus-agent-loop';
import { SkillsManager as Skills } from './manus-skills-system';

export default ManusCore;
export { AgentLoop, Skills };
