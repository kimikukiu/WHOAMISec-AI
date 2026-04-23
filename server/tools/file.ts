export class File {
  async read(params: any): Promise<any> {
    const { path, offset = 1, limit = 500 } = params;
    console.log(`[FILE] Reading: ${path} (lines ${offset}-${offset+limit})`);
    
    try {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const lines = content.split('\n');
      const selected = lines.slice(offset - 1, offset - 1 + limit);
      
      return {
        success: true,
        content: selected.join('\n'),
        total_lines: lines.length
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async write(params: any): Promise<any> {
    const { path, content } = params;
    console.log(`[FILE] Writing to: ${path}`);
    
    try {
      const fs = require('fs');
      fs.writeFileSync(path, content, 'utf-8');
      return { success: true, message: `Written to ${path}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async append(params: any): Promise<any> {
    const { path, content } = params;
    try {
      const fs = require('fs');
      fs.appendFileSync(path, content, 'utf-8');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  help(): string {
    return `File tool - read/write/append files.
Methods: read({path, offset?, limit?}), write({path, content}), append({path, content})`;
  }
}

export default File;
