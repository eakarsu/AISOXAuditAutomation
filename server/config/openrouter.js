const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Parse AI JSON from response - strips markdown fences, finds first { to last }
function parseAIJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    // Strip markdown fences
    let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
    // Find first { to last }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

async function queryAI(prompt, systemPrompt = 'You are an expert SOX audit professional and compliance advisor. Always respond with valid JSON when requested.') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SOX Audit Automation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.choices && parsed.choices[0]) {
            resolve(parsed.choices[0].message.content);
          } else if (parsed.error) {
            reject(new Error(parsed.error.message || 'API error'));
          } else {
            reject(new Error('Unexpected response format'));
          }
        } catch (e) {
          reject(new Error('Could not parse response'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(data);
    req.end();
  });
}

module.exports = { queryAI, parseAIJson };
