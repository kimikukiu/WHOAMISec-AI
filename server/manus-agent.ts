import { Shell } from './tools/shell';
import { File } from './tools/file';
import { Match } from './tools/match';
import { Search } from './tools/search';
import { Schedule } from './tools/schedule';
import { Expose } from './tools/expose';
import { Browser } from './tools/browser';
import { Generate } from './tools/generate';
import { Slides } from './tools/slides';
import { WebDevInit } from './tools/webdev-init';
import { Message } from './tools/message';
import * as fs from 'fs';
import * as path from 'path';

export interface ManusConfig {
  maxIterations: number;
  sandbox: {
    os: string;
    user: string;
    workdir: string;
  };
  tools: string[];
  skillsPath: string;
  swarmNodes: number;
  hermesTiers: string[];
}

export class ManusAgent {
  private config: ManusConfig;
  private tools: Map<string, any>;
  private skills: Map<string, any>;
  private context: any = {};
  private iteration = 0;

  constructor(config?: Partial<ManusConfig>) {
    this.config = {
      maxIterations: 100,
      sandbox: {
        os: 'ubuntu-22.04',
        user: 'ubuntu',
        workdir: '/home/ubuntu'
      },
      tools: [
        'shell', 'file', 'match', 'search', 'schedule', 
        'expose', 'browser', 'generate', 'slides', 
        'webdev_init_project', 'message'
      ],
      skillsPath: './skills',
      swarmNodes: 99999999,
      hermesTiers: ['Mistral-7B', 'Yi-34B', 'Hermes-2-Pro'],
      ...config
    };

    this.tools = new Map();
    this.skills = new Map();
    this.initializeTools();
    this.loadSkills();
    this.loadSwarmModels();
  }

  private initializeTools() {
    this.tools.set('shell', new Shell());
    this.tools.set('file', new File());
    this.tools.set('match', new Match());
    this.tools.set('search', new Search());
    this.tools.set('schedule', new Schedule());
    this.tools.set('expose', new Expose());
    this.tools.set('browser', new Browser());
    this.tools.set('generate', new Generate());
    this.tools.set('slides', new Slides());
    this.tools.set('webdev_init_project', new WebDevInit());
    this.tools.set('message', new Message());
  }

  private loadSkills() {
    const skillsPath = this.config.skillsPath;
    if (!fs.existsSync(skillsPath)) return;

    const skillDirs = fs.readdirSync(skillsPath);
    for (const dir of skillDirs) {
      const skillPath = path.join(skillsPath, dir, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, 'utf-8');
        this.skills.set(dir, { path: skillPath, content });
      }
    }
  }

  private loadSwarmModels() {
    const swarmPath = './swarm-models';
    if (!fs.existsSync(swarmPath)) return;

    const files = fs.readdirSync(swarmPath);
    console.log(`[Manus] Loaded ${files.length} swarm models from ${swarmPath}`);
    
    // Load worm-swarm.js pentru WormGPT mode
    const wormSwarm = path.join(swarmPath, 'worm-swarm.js');
    if (fs.existsSync(wormSwarm)) {
      console.log('[Manus] WormGPT swarm detected - activating restricted mode');
    }
  }

  think(input: string): string {
    this.iteration++;
    console.log(`[Manus] Iteration ${this.iteration}: ${input.substring(0, 50)}...`);

    // Analiza contextului
    this.context = {
      ...this.context,
      lastInput: input,
      timestamp: Date.now()
    };

    // Selectează tool-ul
    const toolName = this.selectTool(input);
    const tool = this.tools.get(toolName);

    if (!tool) {
      return `Tool ${toolName} not found`;
    }

    // Execută acțiunea
    try {
      const result = this.executeAction(tool, input);
      return this.processObservation(result);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  private selectTool(input: string): string {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('fișier') || lowerInput.includes('file') || lowerInput.includes('write') || lowerInput.includes('read')) {
      return 'file';
    }
    if (lowerInput.includes('caută') || lowerInput.includes('search') || lowerInput.includes('găsește')) {
      return 'search';
    }
    if (lowerInput.includes('execută') || lowerInput.includes('run') || lowerInput.includes('comandă') || lowerInput.includes('command')) {
      return 'shell';
    }
    if (lowerInput.includes('generează') || lowerInput.includes('generate') || lowerInput.includes('imagine') || lowerInput.includes('video')) {
      return 'generate';
    }
    if (lowerInput.includes('navighează') || lowerInput.includes('browser') || lowerInput.includes('web')) {
      return 'browser';
    }
    if (lowerInput.includes('programează') || lowerInput.includes('schedule') || lowerInput.includes('cron')) {
      return 'schedule';
    }
    if (lowerInput.includes('expune') || lowerInput.includes('expose') || lowerInput.includes('port')) {
      return 'expose';
    }
    if (lowerInput.includes('prezentare') || lowerInput.includes('slides') || lowerInput.includes('powerpoint')) {
      return 'slides';
    }
    if (lowerInput.includes('proiect') || lowerInput.includes('init') || lowerInput.includes('webdev')) {
      return 'webdev_init_project';
    }

    return 'message'; // default
  }

  private executeAction(tool: any, input: string): any {
    // Placeholder pentru execuția reală
    return { success: true, output: `Executed ${tool.constructor.name} with input: ${input.substring(0, 100)}` };
  }

  private processObservation(result: any): string {
    if (result.success) {
      return `✅ ${result.output}`;
    }
    return `❌ Error: ${result.output}`;
  }

  getStatus(): any {
    return {
      iteration: this.iteration,
      tools: Array.from(this.tools.keys()),
      skills: Array.from(this.skills.keys()),
      config: this.config
    };
  }

  // Ciclu complet de operare
  async agentLoop(instruction: string): Promise<string> {
    let currentInstruction = instruction;
    
    while (this.iteration < this.config.maxIterations) {
      const thought = this.think(currentInstruction);
      
      if (thought.includes('COMPLETE') || thought.includes('FINAL')) {
        return this.deliverOutcome(thought);
      }
      
      // Simulare observație pentru următoarea iterație
      currentInstruction = `Continuă: ${thought}`;
    }
    
    return 'Max iterations reached';
  }

  private deliverOutcome(result: string): string {
    return `📦 REZULTAT FINAL:\n${result}`;
  }
}

// Export pentru WormGPT mode
export const activateWormGPT = () => {
  console.log('🐛 WormGPT mode activated - 99.999.999 swarm nodes online');
  return new ManusAgent({ swarmNodes: 99999999 });
};
