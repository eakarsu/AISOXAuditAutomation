const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function queryAI(prompt, systemPrompt = 'You are an expert SOX audit professional and compliance advisor. Provide detailed, actionable analysis.') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
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
            resolve(`AI Analysis unavailable: ${parsed.error.message || 'API error'}`);
          } else {
            resolve('AI Analysis unavailable: Unexpected response format');
          }
        } catch (e) {
          resolve('AI Analysis unavailable: Could not parse response');
        }
      });
    });

    req.on('error', (e) => resolve(`AI Analysis unavailable: ${e.message}`));
    req.setTimeout(30000, () => {
      req.destroy();
      resolve('AI Analysis unavailable: Request timed out');
    });
    req.write(data);
    req.end();
  });
}

module.exports = { queryAI };
