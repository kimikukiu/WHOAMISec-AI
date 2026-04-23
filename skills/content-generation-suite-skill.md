---
name: content-generation-suite
description: Complete content generation suite - images, videos, audio, music, presentations, and web/mobile project initialization
category: creative
---

# Content Generation Suite

Complete content generation capabilities for AI agents - images, videos, audio, music, text-to-speech, presentations, and web/mobile development.

## Capabilities Overview

### 5. Content Generation & Presentation

#### **Generate Mode**
Create or edit:
- 🎨 **Images** (descriptions, prompts for AI generators)
- 🎬 **Videos** (scripts, storyboards, scene descriptions)
- 🔊 **Audio** (voiceovers, sound effects)
- 🎵 **Music** (compositions, lyrics, MIDI prompts)
- 🔊 **Text-to-Speech** (natural voice generation)
- 📎 **Media References** (citations, attributions)

#### **Slides Mode**
Create and adjust presentations with 2 generation modes:
- **HTML Mode:** Rich data content, editable structure, interactive elements
- **Image Mode:** Visually impressive presentations, image-based slides

**Usage:**
```
/generate image: A futuristic cityscape at sunset
/generate video: 30-second product demo script
/generate music: Upbeat electronic track for workout
/slides create: Q3 Board Meeting Presentation
/slides edit: Add chart to slide 3
```

### 6. Web & Mobile Development

#### **Project Initialization (webdev_init_project)**
Initialize new web/mobile projects with predefined scaffolds:
- `web-static` - Static HTML/CSS/JS sites
- `web-db-user` - Full-stack with database + user auth
- `mobile-app` - React Native / Expo mobile app
- `web-nextjs` - Next.js with API routes
- `web-vite-react` - Vite + React SPA

**Usage:**
```
/init_project web-nextjs MyAwesomeApp
/init_project mobile-app MyMobileApp
/init_project web-static PortfolioSite
```

## Extended Skill Set

The agent can now handle a wide range of requests:

### Analytics & Research
- 📈 **stock-analysis** - Stock & company analysis using financial market data
- 🌐 **similarweb-analytics** - Website/domain analysis using SimilarWeb traffic data

### Content Creation
- 🎵 **music-prompter** - Guidelines for creating music-related prompts
- 🎥 **video-generator** - Professional video production workflow
- 📊 **excel-generator** - Create professional Excel spreadsheets
- 📝 **blog-writer** - SEO-optimized blog content

### Development & Search
- 🛠️ **skill-creator** - Guide for creating/updating agent skills
- 🔍 **internet-skill-finder** - Search/recommend GitHub-verified agent skills
- 🔎 **github-gem-seeker** - Search tested GitHub solutions for common problems
- 🤖 **manus-api** - Manage Manus tasks/projects via API
- 📂 **google-workspace** - Best practices for Google Workspace CLI

### Productivity
- 📑 **ppt** - PowerPoint generation with Python
- 📄 **pdf** - Edit PDFs with natural language
- 📊 **xlsx** - Excel automation with Python
- 🎨 **pixel-art** - Retro pixel art conversion
- 📊 **popular-web-designs** - 54 production design systems

## Integration Examples

### Generate Mode Example
```
User: Create a 30-second video script for a new fitness app
Bot: 🎬 **Video Script Generated**

**Title:** "FitApp Pro - Transform Your Life"
**Duration:** 30 seconds
**Scenes:**
1. (0-5s) Hook: Person struggling with motivation
2. (5-15s) Solution: FitApp Pro interface showcase
3. (15-25s) Benefits: Transformation montage
4. (25-30s) CTA: "Download now - Free trial"

**Voiceover Script:** [Included...]
```

### Slides Mode Example
```
User: Create a board meeting presentation about Q3 results
Bot: 📊 **Presentation Created**

**Title:** Q3 2024 Results
**Slides:** 12
- Slide 1: Title + Company Logo
- Slide 2-3: Executive Summary
- Slide 4-6: Financial Performance
- Slide 7-9: Key Metrics
- Slide 10-12: Q4 Projections

**Format:** HTML (editable) / Image (visual)
```

### Web/Mobile Init Example
```
User: Start a new Next.js project called "ECommerceStore"
Bot: 🚀 **Project Initialized**

**Type:** Next.js with API routes
**Location:** ~/projects/ECommerceStore
**Features:**
- ✅ Pre-configured with TypeScript
- ✅ Tailwind CSS setup
- ✅ API routes template
- ✅ Database integration ready
- ✅ Deployment config (Vercel)

**Next Steps:** `cd ECommerceStore && npm install`
```

## Notes

- All generation uses **GitHub Models API** (gpt-4o-mini) - **FREE**
- No technical details shown to clients
- Clean, professional output
- Supports multiple output formats
- Integration with existing Auto Post module

---

**This extended skill set allows the agent to tackle a wide range of requests, from routine tasks to complex development and creative projects.**