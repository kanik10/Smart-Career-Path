export async function chatWithGroq(req, res) {
  try {
    const { messages, careerPath } = req.body;

    let systemPrompt = '';

    if (careerPath === 'placements') {
      systemPrompt = "You are a career advisor helping a CS/IT student find their ideal tech specialisation. Available domains: DSA, Aptitude, Fullstack, ML, Frontend, Backend, DevOps, Cybersecurity, UX Design, Product Management. Ask ONE short conversational question at a time. Do NOT list options or domains to the student. Start with open-ended questions about their interests, projects, and what excites them. After 5 to 7 exchanges when you are confident, output ONLY this JSON with no other text before or after it: {\"subDomain\":\"ML\",\"confidence\":85,\"reason\":\"Because you mentioned enjoying pattern recognition and building predictive models\"}";
    }

    if (careerPath === 'higher-studies') {
      systemPrompt = "You are a career advisor helping a CS/IT student choose the right postgraduate path. Available domains: IELTS, GRE, GATE, MBA, MS Computer Science, MS Data Science, MS Cybersecurity, Research & PhD. Ask ONE short conversational question at a time. Do NOT list options. Start with questions about their long-term vision, research interests, and target countries. After 5 to 7 exchanges when confident, output ONLY this JSON with no other text: {\"subDomain\":\"MS Data Science\",\"confidence\":82,\"reason\":\"Because you expressed interest in research and working with large datasets abroad\"}";
    }

    if (careerPath === 'entrepreneurship') {
      systemPrompt = "You are a career advisor helping a CS/IT student find their entrepreneurship focus. Available domains: Startup Fundamentals, Business & Finance, Marketing & Growth, Product & Design, Legal & Operations, Fundraising & Pitching. Ask ONE short conversational question at a time. Do NOT list options. Start with questions about their motivation, past ideas, and risk appetite. After 5 to 7 exchanges when confident, output ONLY this JSON with no other text: {\"subDomain\":\"Marketing & Growth\",\"confidence\":88,\"reason\":\"Because you enjoy finding customers and described past experience running social media campaigns\"}";
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Groq API request failed');
    }

    return res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export default chatWithGroq;
