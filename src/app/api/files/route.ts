import { NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: 'file' | 'directory';
}

function listDir(dirPath: string, label: string): FileInfo[] {
  const files: FileInfo[] = [];
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith('.')) continue;

      const fullPath = join(dirPath, entry.name);
      const stats = statSync(fullPath);
      files.push({
        name: entry.name,
        path: `${label}/${entry.name}`,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        type: entry.isDirectory() ? 'directory' : 'file',
      });
    }
  } catch {
    // Directory may not exist
  }
  return files;
}

export async function GET() {
  try {
    const projectRoot = process.cwd();

    const downloads = listDir(join(projectRoot, 'downloads'), 'downloads');
    const generated = listDir(join(projectRoot, 'generated_code'), 'generated_code');

    // Sort by modified date descending
    const sortFiles = (a: FileInfo, b: FileInfo) =>
      new Date(b.modified).getTime() - new Date(a.modified).getTime();

    downloads.sort(sortFiles);
    generated.sort(sortFiles);

    return NextResponse.json({
      success: true,
      downloads: {
        path: 'downloads',
        count: downloads.length,
        files: downloads,
      },
      generated_code: {
        path: 'generated_code',
        count: generated.length,
        files: generated,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
