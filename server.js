const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'AIzaSyACJ1JRDZM4WLzwFfMGSv8GskYLIOzXi-8');

app.use(cors());
app.use(express.json());

// Serve static frontend
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));


// Simple health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// AI generation endpoint with Google AI
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, mode } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const selectedMode = typeof mode === 'string' ? mode : 'blog';
    
    // Generate ideas using Google AI
    const ideas = await generateIdeasWithAI(prompt, selectedMode);

    res.json({ ideas });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate ideas' });
  }
});

// Generate ideas using Google AI with improved prompts
async function generateIdeasWithAI(topic, mode) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = createAdvancedPrompt(topic, mode);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the AI response and extract ideas
    const ideas = parseAIResponse(text);
    
    // Fallback to mock data if AI fails
    if (!ideas || ideas.length === 0) {
      console.log('AI response failed, using fallback');
      return generateMockIdeas(topic, mode);
    }
    
    return ideas;
  } catch (error) {
    console.error('Google AI Error:', error);
    // Fallback to mock data
    return generateMockIdeas(topic, mode);
  }
}

// Create advanced prompts for different modes
function createAdvancedPrompt(topic, mode) {
  const baseInstructions = `You are a professional content creator and marketing expert. Generate 8 creative, engaging, and high-converting content ideas for the topic: "${topic}".`;
  
  const modeSpecificInstructions = {
    blog: `Create compelling blog post titles that are:
    - SEO-optimized and click-worthy
    - Include power words and emotional triggers
    - Address specific pain points or benefits
    - Use numbers, questions, or "how-to" formats
    - Keep between 50-70 characters for optimal sharing`,
    
    youtube: `Create viral YouTube video titles that are:
    - Attention-grabbing and curiosity-driven
    - Include trending keywords and phrases
    - Use emotional hooks and cliffhangers
    - Optimized for YouTube's algorithm
    - Include emojis strategically
    - Keep under 60 characters for mobile viewing`,
    
    tweet: `Create engaging Twitter/X post ideas that are:
    - Concise and punchy (under 280 characters)
    - Include relevant hashtags
    - Use storytelling or controversial angles
    - Include calls-to-action
    - Tap into current trends and conversations
    - Use emojis to increase engagement`
  };
  
  const formatInstructions = `Format your response as a numbered list (1-8) with each idea on a new line. Make each idea unique, creative, and tailored to the specific mode.`;
  
  return `${baseInstructions}\n\n${modeSpecificInstructions[mode] || modeSpecificInstructions.blog}\n\n${formatInstructions}`;
}

// Parse AI response to extract ideas
function parseAIResponse(text) {
  try {
    // Split by lines and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract numbered items or bullet points
    const ideas = lines
      .map(line => {
        // Remove numbering (1., 2., etc.) or bullets (-, *, etc.)
        return line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim();
      })
      .filter(line => line.length > 10 && line.length < 200) // Filter reasonable length
      .slice(0, 8); // Take first 8 ideas
    
    return ideas;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return [];
  }
}

// Fallback mock function (kept for reliability)
function generateMockIdeas(topic, mode) {
  const normalized = topic.trim();
  const label = modeLabel(mode);
  const base = [
    `10x Your ${normalized} Growth: 8 Irresistible ${label} You Must Try 🚀`,
    `The Ultimate ${normalized} Playbook: High-Conversion ${label} That Hook Instantly`,
    `Stop Scrolling! Killer ${label} for ${normalized} That Demand Attention ⚡`,
    `${normalized} in 2025: Trends, Myths, and Proven ${label} That Win`,
    `From Zero to Pro: Beginner-Friendly ${label} for ${normalized} That Work`,
    `Steal These ${label}: Viral ${normalized} Angles Backed by Psychology 🧠`,
    `No-Fluff ${label}: Clear, Clickable ${normalized} Ideas People Love ✅`,
    `7-Second Hooks: Short, Punchy ${label} for ${normalized} That Convert`,
  ];
  return base.slice(0, 8);
}

function capitalized(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function modeLabel(mode) {
  const m = String(mode || '').toLowerCase();
  if (m === 'youtube') return 'YouTube Titles';
  if (m === 'tweet') return 'Tweet Ideas';
  return 'Blog Titles';
}

// Fallback to SPA index.html for any non-API route
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.method !== 'GET') return next();
  return res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


