export class Shell {
  private History: string[] = [];

  async execute(params: any): Promise<any> {
    const { command, workdir, timeout = 60 } = params;
    console.log(`[SHELL] Executing: ${command}`);
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const result = await execPromise(command, { 
        cwd: workdir || process.cwd(),
        timeout: timeout * 1000 
      });
      
      this.History.push(command);
      
      return {
        success: true,
        output: result.stdout,
        stderr: result.stderr,
        exitCode: 0
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.message,
        stderr: error.stderr || '',
        exitCode: error.code || 1
      };
    }
  }

  view(): string[] {
    return this.History;
  }

  help(): string {
    return `Shell tool - execute commands in sandbox.
Methods: execute({command, workdir?, timeout?}), view()`;
  }
}

export default Shell;
