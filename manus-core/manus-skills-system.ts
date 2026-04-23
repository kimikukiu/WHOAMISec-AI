/**
 * Manus Skills System - Complete Implementation
 * Based on deep_manus_blueprint.txt Section 6
 * 
 * Skills are modular functionality modules that extend Manus capabilities
 * Each skill is a directory with SKILL.md + optional resources
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface Skill {
  name: string;
  description: string;
  category?: string;
  version?: string;
  author?: string;
  tools?: string[];
  dependencies?: string[];
  execute?: (params: any) => Promise<any>;
}

export interface SkillContext {
  agentState: any;
  tools: any;
  userInput: string;
  environment: any;
}

export class SkillsManager {
  private skillsPath: string;
  private loadedSkills: Map<string, Skill>;

  constructor(skillsPath: string = './skills') {
    this.skillsPath = skillsPath;
    this.loadedSkills = new Map();
  }

  /**
   * Load a skill from directory
   */
  async loadSkill(skillName: string): Promise<Skill | null> {
    try {
      const skillPath = path.join(this.skillsPath, skillName);
      const skillMdPath = path.join(skillPath, 'SKILL.md');
      
      // Check if skill exists
      await fs.access(skillMdPath);
      
      // Read SKILL.md
      const content = await fs.readFile(skillMdPath, 'utf-8');
      const skill = this.parseSkillMd(content);
      skill.name = skillName;
      
      // Load any additional resources
      await this.loadSkillResources(skillPath, skill);
      
      this.loadedSkills.set(skillName, skill);
      console.log(`[Skills] Loaded skill: ${skillName}`);
      
      return skill;
    } catch (error: any) {
      console.error(`[Skills] Failed to load skill ${skillName}:`, error.message);
      return null;
    }
  }

  /**
   * Parse SKILL.md frontmatter + content
   */
  private parseSkillMd(content: string): Skill {
    const skill: Skill = {
      name: '',
      description: '',
      tools: []
    };

    // Extract YAML frontmatter between ---
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const lines = frontmatter.split('\n');
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (key.trim() === 'name') skill.name = value;
        if (key.trim() === 'description') skill.description = value;
        if (key.trim() === 'category') skill.category = value;
        if (key.trim() === 'version') skill.version = value;
        if (key.trim() === 'author') skill.author = value;
        if (key.trim() === 'tools') {
          try { skill.tools = JSON.parse(value); } catch { skill.tools = value.split(',').map(t => t.trim()); }
        }
        if (key.trim() === 'dependencies') {
          try { skill.dependencies = JSON.parse(value); } catch { skill.dependencies = value.split(',').map(d => d.trim()); }
        }
      }
    }

    // Store full content as description if not set
    if (!skill.description) {
      skill.description = content.substring(0, 500);
    }

    return skill;
  }

  /**
   * Load skill resources (scripts, templates, etc.)
   */
  private async loadSkillResources(skillPath: string, skill: Skill): Promise<void> {
    try {
      const files = await fs.readdir(skillPath, { withFileTypes: true });
      
      for (const file of files) {
        if (file.name === 'SKILL.md') continue;
        
        const filePath = path.join(skillPath, file.name);
        
        if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.ts'))) {
          // Load script
          try {
            // Dynamic import (in production, use a proper module loader)
            const scriptContent = await fs.readFile(filePath, 'utf-8');
            skill.execute = new Function('params', scriptContent) as any;
          } catch (error) {
            console.error(`[Skills] Failed to load script ${file.name}:`, error);
          }
        }
      }
    } catch (error) {
      // No additional resources
    }
  }

  /**
   * List all available skills
   */
  async listSkills(): Promise<Skill[]> {
    try {
      const dirs = await fs.readdir(this.skillsPath, { withFileTypes: true });
      const skills: Skill[] = [];
      
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const skill = await this.loadSkill(dir.name);
          if (skill) skills.push(skill);
        }
      }
      
      return skills;
    } catch (error) {
      return [];
    }
  }

  /**
   * Execute a skill
   */
  async executeSkill(skillName: string, params: any, context: SkillContext): Promise<any> {
    let skill = this.loadedSkills.get(skillName);
    
    if (!skill) {
      skill = await this.loadSkill(skillName);
    }
    
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    if (skill.execute) {
      return await skill.execute({ ...params, context });
    }
    
    return {
      skill: skill.name,
      description: skill.description,
      status: 'loaded (no execute function)',
      params
    };
  }

  /**
   * Create a new skill
   */
  async createSkill(skill: Skill, skillPath?: string): Promise<string> {
    const basePath = skillPath || this.skillsPath;
    const dirPath = path.join(basePath, skill.name);
    
    try {
      await fs.mkdir(dirPath, { recursive: true });
      
      // Create SKILL.md
      const frontmatter = [
        '---',
        `name: ${skill.name}`,
        `description: ${skill.description}`,
        skill.category ? `category: ${skill.category}` : '',
        skill.version ? `version: ${skill.version}` : '',
        skill.author ? `author: ${skill.author}` : '',
        skill.tools ? `tools: [${skill.tools.join(', ')}]` : '',
        skill.dependencies ? `dependencies: [${skill.dependencies.join(', ')}]` : '',
        '---',
        '',
        `# ${skill.name}`,
        '',
        skill.description,
        ''
      ].filter(l => l !== '').join('\n');
      
      await fs.writeFile(path.join(dirPath, 'SKILL.md'), frontmatter);
      
      return `Skill created: ${skill.name} at ${dirPath}`;
    } catch (error: any) {
      throw new Error(`Failed to create skill: ${error.message}`);
    }
  }
}

// Export singleton
export const skillsManager = new SkillsManager();
