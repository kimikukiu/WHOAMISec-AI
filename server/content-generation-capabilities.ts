/**
 * Content Generation & Presentation Capabilities
 * Integrated from: 5._Capacități_de_Generare_și_Prezentare.docx
 */

export interface GenerationCapabilities {
  content: string[];
  presentation: string[];
  video: string[];
  documents: string[];
}

export const CAPABILITIES: GenerationCapabilities = {
  content: [
    "🤖 Generate social media posts (Twitter, Instagram, TikTok, LinkedIn)",
    "📝 Generate articles & blog posts (500-2000 words)",
    "🎨 Generate image descriptions & prompts (for AI image generators)",
    "📱 Generate Reels/TikTok scripts (with hooks & CTAs)",
    "💡 Generate ideas & content strategies"
  ],
  presentation: [
    "📊 Generate PowerPoint presentations (structure + content)",
    "🎥 Generate slide decks (title, bullets, speaker notes)",
    "📈 Generate charts & data visualizations descriptions",
    "🎨 Design suggestions (layout, colors, fonts)"
  ],
  video: [
    "🎬 Generate video scripts (with timestamps & scenes)",
    "🎥 Generate storyboards (scene descriptions)",
    "🎙 Generate voiceover scripts (tone & pacing)",
    "📹 Generate YouTube/TikTok content plans"
  ],
  documents: [
    "📄 Generate PDF reports (executive summaries)",
    "📑 Generate professional documents (proposals, contracts)",
    "📊 Generate research papers (structure & citations)",
    "📝 Generate documentation (technical, user manuals)"
  ]
};

export function formatCapabilitiesList(): string {
  let text = "🤖 **Content Generation & Presentation Capabilities**\n\n";
  
  text += "**📝 Content Generation:**\n";
  CAPABILITIES.content.forEach(item => {
    text += `• ${item}\n`;
  });
  
  text += "\n**📊 Presentation & Slides:**\n";
  CAPABILITIES.presentation.forEach(item => {
    text += `• ${item}\n`;
  });
  
  text += "\n**🎥 Video & Media:**\n";
  CAPABILITIES.video.forEach(item => {
    text += `• ${item}\n`;
  });
  
  text += "\n**📄 Documents & Reports:**\n";
  CAPABILITIES.documents.forEach(item => {
    text += `• ${item}\n`;
  });
  
  return text;
}

export async function generateContent(
  type: keyof GenerationCapabilities,
  prompt: string,
  providerManager: any
): Promise<string> {
  const systemPrompt = `You are an expert content generator. Create professional, engaging content.`;
  
  const fullPrompt = `Generate ${type} content about: ${prompt}\n\nProvide structured, ready-to-use output.`;
  
  try {
    const response = await providerManager.generateContent(fullPrompt, {
      model: 'gpt-4o-mini',
      maxTokens: 2000
    });
    return response;
  } catch (error) {
    throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
