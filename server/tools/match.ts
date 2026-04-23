export class Match {
  async glob(params: any): Promise<any> {
    const { pattern, path = '.', file_glob = None } = params;
    console.log(`[MATCH] Glob: ${pattern} in ${path}`);
    
    try {
      const glob = require('glob');
      const files = glob.sync(pattern, { cwd: path });
      return { success: true, files, count: files.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async grep(params: any): Promise<any> {
    const { pattern, path = '.', file_glob = None } = params;
    console.log(`[MATCH] Grep: ${pattern}`);
    
    return { 
      success: true, 
      message: 'Grep functionality - use shell grep or implement with fs.readdirSync' 
    };
  }

  help(): string {
    return `Match tool - glob and grep files.
Methods: glob({pattern, path?, file_glob?}), grep({pattern, path?, file_glob?})`;
  }
}

export default Match;
