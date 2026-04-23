/**
 * GitHub Code Search Provider
 * FREE "GPT" using GitHub's code search as knowledge base
 * No LLM needed - returns actual code examples and documentation
 */

import { Octokit } from '@octokit/rest';
import { BaseProvider, LLMRequest, LLMResponse, LLMMessage } from './base-provider';

export class GitHubCodeSearchProvider extends BaseProvider {
  name = 'github-code-search';
  displayName = 'GitHub Code Search (FREE Knowledge)';
  models = ['code-search-v1'];

  private octokit: Octokit;
  private token: string;

  constructor(token?: string) {
    super();
    this.token = token || process.env.GITHUB_TOKEN || '';
    this.octokit = new Octokit({
      auth: this.token,
    });
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const lastMessage = request.messages[request.messages.length - 1];
    const query = lastMessage?.content || '';

    try {
      // Search GitHub code
      const searchResponse = await this.octokit.search.code({
        q: `${query} in:file language:typescript OR language:javascript`,
        per_page: 5,
        sort: 'indexed',
        order: 'desc',
      });

      const items = searchResponse.data.items || [];
      
      let text = `## 🔍 GitHub Code Search Results for: "${query}"\n\n`;
      
      if (items.length === 0) {
        text += 'No code examples found. Try a different query.\n';
      } else {
        items.forEach((item: any, index: number) => {
          text += `### ${index + 1}. [${item.repository.full_name}](${item.html_url})\n`;
          text += `**File:** \`${item.path}\`\n\n`;
          
          // Get file content if available
          if (item.text_matches) {
            text += `**Matches:**\n\`;
            item.text_matches.slice(0, 3).forEach((match: any) => {
              text += match.fragment.substring(0, 200) + '...\n';
            });
            text += '\`\n\n';
          }
        });
        
        text += `\n**Total results:** ${searchResponse.data.total_count} code examples found.\n`;
      }

      return {
        text,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: 'code-search-v1',
        provider: this.name,
      };
    } catch (error) {
      console.error('[GitHub Code Search] Error:', error);
      return {
        text: `Error searching GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        model: 'code-search-v1',
        provider: this.name,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available, even without token (limited rate)
  }
}

export function createGitHubCodeSearchProvider(token?: string): GitHubCodeSearchProvider {
  return new GitHubCodeSearchProvider(token || process.env.GITHUB_TOKEN);
}
