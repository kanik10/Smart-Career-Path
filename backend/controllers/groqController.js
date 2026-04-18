const DOMAIN_OPTIONS = {
  placements: ['DSA', 'Aptitude', 'Fullstack', 'ML', 'Frontend', 'Backend', 'DevOps', 'Cybersecurity', 'UX Design', 'Product Management'],
  'higher-studies': ['IELTS', 'GRE', 'GATE', 'MBA', 'MS Computer Science', 'MS Data Science', 'MS Cybersecurity', 'Research & PhD'],
  entrepreneurship: ['Startup Fundamentals', 'Business & Finance', 'Marketing & Growth', 'Product & Design', 'Legal & Operations', 'Fundraising & Pitching'],
};

const MIN_USER_TURNS_FOR_RECOMMENDATION = 4;

const FOLLOW_UP_QUESTIONS = {
  placements: [
    'Which kind of work do you enjoy most: coding logic, building UI, backend APIs, or data/model work?',
    'Tell me one project you liked and which exact part you enjoyed most day-to-day.',
    'Do you prefer product building speed, deep technical problem solving, or systems/infrastructure work?',
    'What role would make you excited to work every day after graduation?',
  ],
  'higher-studies': [
    'Do you prefer research-heavy study or coursework-focused programs?',
    'Are you targeting exams in India, admissions abroad, or management studies?',
    'Which subjects in your degree did you enjoy most and why?',
    'Do you see yourself in industry engineering, research, or leadership roles?',
  ],
  entrepreneurship: [
    'Do you enjoy idea validation with users more, or building products more?',
    'Which startup function attracts you most right now: growth, finance, product, or operations?',
    'Have you done any selling, pitching, or side initiative before?',
    'If you started today, which startup responsibility would you take first?',
  ],
};

const KEYWORD_WEIGHTS = {
  placements: {
    DSA: ['dsa', 'algorithm', 'problem solving', 'leetcode', 'competitive programming', 'data structure'],
    Aptitude: ['aptitude', 'quant', 'reasoning', 'logical reasoning', 'verbal'],
    Fullstack: ['fullstack', 'full stack', 'end to end', 'mern', 'build complete apps'],
    ML: ['ml', 'machine learning', 'ai', 'model', 'data science', 'prediction', 'neural'],
    Frontend: ['frontend', 'react', 'ui', 'ux', 'design', 'css', 'javascript ui'],
    Backend: ['backend', 'api', 'server', 'database', 'node', 'express', 'sql'],
    DevOps: ['devops', 'docker', 'kubernetes', 'ci/cd', 'aws', 'cloud', 'deployment'],
    Cybersecurity: ['cybersecurity', 'security', 'ethical hacking', 'penetration', 'network security'],
    'UX Design': ['ux', 'user research', 'wireframe', 'prototype', 'usability'],
    'Product Management': ['product', 'roadmap', 'feature prioritization', 'customer problem', 'stakeholder'],
  },
  'higher-studies': {
    IELTS: ['ielts', 'english test', 'language test'],
    GRE: ['gre', 'abroad exam', 'graduate exam'],
    GATE: ['gate', 'psu', 'mtech'],
    MBA: ['mba', 'management', 'business school', 'leadership'],
    'MS Computer Science': ['ms cs', 'computer science masters', 'systems', 'software engineering masters'],
    'MS Data Science': ['data science masters', 'analytics masters', 'ml masters', 'statistics'],
    'MS Cybersecurity': ['cybersecurity masters', 'security masters'],
    'Research & PhD': ['research', 'paper', 'phd', 'academia', 'publication'],
  },
  entrepreneurship: {
    'Startup Fundamentals': ['startup basics', 'startup', 'validate idea', 'mvp'],
    'Business & Finance': ['finance', 'revenue', 'unit economics', 'pricing', 'cash flow'],
    'Marketing & Growth': ['marketing', 'growth', 'acquisition', 'social media', 'sales funnel'],
    'Product & Design': ['product', 'design', 'prototype', 'user journey', 'ux'],
    'Legal & Operations': ['legal', 'operations', 'compliance', 'contracts', 'process'],
    'Fundraising & Pitching': ['fundraising', 'pitch', 'investor', 'deck', 'venture capital'],
  },
};

const countUserTurns = (messages = []) => {
  return (messages || []).filter((item) => item?.role === 'user' && item?.content).length;
};

const collectUserText = (messages = []) => {
  return (messages || [])
    .filter((item) => item?.role === 'user' && item?.content)
    .map((item) => String(item.content).toLowerCase())
    .join(' ');
};

const askAdaptiveFollowUp = (careerPath, userTurns) => {
  const pool = FOLLOW_UP_QUESTIONS[careerPath] || FOLLOW_UP_QUESTIONS.placements;
  return pool[Math.min(userTurns, pool.length - 1)];
};

const scoreOptions = (careerPath, userText) => {
  const optionKeywords = KEYWORD_WEIGHTS[careerPath] || KEYWORD_WEIGHTS.placements;

  return Object.entries(optionKeywords).map(([option, keywords]) => {
    let score = 0;
    const matched = [];

    keywords.forEach((keyword) => {
      if (userText.includes(keyword.toLowerCase())) {
        score += keyword.includes(' ') ? 3 : 2;
        matched.push(keyword);
      }
    });

    return { option, score, matched };
  });
};

const fallbackByPath = {
  placements: 'Fullstack',
  'higher-studies': 'GRE',
  entrepreneurship: 'Startup Fundamentals',
};

const buildRecommendation = (careerPath, messages = []) => {
  const options = DOMAIN_OPTIONS[careerPath] || DOMAIN_OPTIONS.placements;
  const userText = collectUserText(messages);
  const scored = scoreOptions(careerPath, userText).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1] || { score: 0 };

  let selected = top?.option || fallbackByPath[careerPath] || options[0];
  if (!selected || !options.includes(selected)) {
    selected = fallbackByPath[careerPath] || options[0];
  }

  const evidenceGap = Math.max(0, (top?.score || 0) - (second?.score || 0));
  const base = 58 + Math.min(20, (top?.score || 0) * 2);
  const gapBonus = Math.min(14, evidenceGap * 2);
  const confidence = Math.max(55, Math.min(95, Math.round(base + gapBonus)));

  const matchedEvidence = (top?.matched || []).slice(0, 3);
  const reason = matchedEvidence.length
    ? `You consistently mentioned ${matchedEvidence.join(', ')}, which aligns strongly with ${selected}.`
    : `${selected} is currently the best fit from your answers and preferred working style.`;

  return {
    subDomain: selected,
    confidence,
    reason,
  };
};

export async function chatWithGroq(req, res) {
  try {
    const { messages, careerPath } = req.body;
    const safeMessages = Array.isArray(messages) ? messages : [];
    const safeCareerPath = DOMAIN_OPTIONS[careerPath] ? careerPath : 'placements';
    const userTurns = countUserTurns(safeMessages);

    if (userTurns < MIN_USER_TURNS_FOR_RECOMMENDATION) {
      return res.json({
        isRecommendation: false,
        reply: askAdaptiveFollowUp(safeCareerPath, userTurns),
      });
    }

    const recommendation = buildRecommendation(safeCareerPath, safeMessages);

    return res.json({
      isRecommendation: true,
      reply: JSON.stringify(recommendation),
    });
  } catch (error) {
    console.error('Chatbot Error:', error);
    return res.status(500).json({ message: 'An error occurred while generating a response.' });
  }
}

export default chatWithGroq;
