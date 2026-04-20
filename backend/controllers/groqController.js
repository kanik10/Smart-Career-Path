const DOMAIN_OPTIONS = {
  placements: ['DSA', 'Aptitude', 'Fullstack', 'ML', 'Frontend', 'Backend', 'DevOps', 'Cybersecurity', 'UX Design', 'Product Management'],
  'higher-studies': ['IELTS', 'GRE', 'GATE', 'MBA', 'MS Computer Science', 'MS Data Science', 'MS Cybersecurity', 'Research & PhD'],
  entrepreneurship: ['Startup Fundamentals', 'Business & Finance', 'Marketing & Growth', 'Product & Design', 'Legal & Operations', 'Fundraising & Pitching'],
};

const MIN_USER_TURNS_FOR_RECOMMENDATION = 4;

const FOLLOW_UP_QUESTIONS = {
  placements: [
    'Which kind of work do you enjoy most: coding logic, building UI, backend APIs, or systems/infra work?',
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

const PLACEMENTS_THEME_QUESTIONS = {
  frontendDepth: 'You mentioned frontend interest. Do you enjoy building UI interactions more, or integrating APIs and handling app state?',
  backendDepth: 'You mentioned backend interest. Do you prefer API design, database optimization, or distributed system reliability work?',
  fullstackBalance: 'Do you want to stay balanced across frontend and backend, or specialize deeper into one side?',
  projectSpecific: 'Can you share one specific project and exactly which tasks you enjoyed most while building it?',
  rolePreference: 'Which role sounds most exciting to you right now: frontend engineer, backend engineer, fullstack developer, DevOps, or data/ML?',
  mlDepth: 'If you explore ML, do you enjoy data cleaning, model training, experimentation, or deploying models to production?',
};

const HIGHER_STUDIES_THEME_QUESTIONS = {
  targetType: 'Are you aiming mainly for India-based exams, global admissions, or management-focused programs?',
  subjectFocus: 'Which academic subjects do you want to study deeper at masters level?',
  outcomeGoal: 'After higher studies, do you see yourself in research, advanced engineering roles, or leadership tracks?',
  examReadiness: 'How much time can you consistently invest weekly for preparation and profile-building?',
};

const ENTREPRENEURSHIP_THEME_QUESTIONS = {
  startingPoint: 'What excites you more right now: solving customer pain points, building product features, or scaling growth?',
  functionalFit: 'Which startup function matches your strengths today: product, growth, finance, or operations?',
  executionStyle: 'Do you enjoy rapid experimentation with users, or structured execution with long planning cycles?',
  runwaySignal: 'Are you more confident in validating demand first, or building an MVP first?',
};

const ML_TERMS = ['ml', 'machine learning', 'ai', 'prediction', 'pattern recognition', 'data science'];
const NEGATIVE_REPLIES = ['no', 'nope', 'not really', 'nah', 'no thanks'];

const KEYWORD_WEIGHTS = {
  placements: {
    DSA: ['dsa', 'algorithm', 'problem solving', 'leetcode', 'competitive programming', 'data structure'],
    Aptitude: ['aptitude', 'quant', 'reasoning', 'logical reasoning', 'verbal'],
    Fullstack: ['fullstack', 'full stack', 'end to end', 'mern', 'build complete apps'],
    ML: ['ml', 'machine learning', 'ai', 'data science', 'prediction', 'neural'],
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

const isNegativeReply = (text = '') => {
  const value = String(text || '').trim().toLowerCase();
  return NEGATIVE_REPLIES.includes(value);
};

const previousAssistantWasMlLeading = (messages = [], index) => {
  const previous = messages[index - 1];
  if (!previous || previous.role !== 'assistant') return false;
  const content = String(previous.content || '').toLowerCase();
  return ML_TERMS.some((term) => content.includes(term));
};

const computeMlPenalty = (messages = []) => {
  let penalty = 0;
  for (let i = 1; i < messages.length; i += 1) {
    const current = messages[i];
    if (current?.role !== 'user') continue;
    if (!isNegativeReply(current.content)) continue;
    if (previousAssistantWasMlLeading(messages, i)) {
      penalty += 6;
    }
  }
  return penalty;
};

const collectAssistantQuestions = (messages = []) => {
  return new Set(
    (messages || [])
      .filter((item) => item?.role === 'assistant' && item?.content)
      .map((item) => String(item.content).trim().toLowerCase())
  );
};

const pickFirstUnasked = (candidates = [], askedSet) => {
  return candidates.find((candidate) => !askedSet.has(String(candidate).trim().toLowerCase())) || null;
};

const placementSignalCandidates = (userText = '') => {
  const hasFrontend = /\b(frontend|front end|react|ui|ux|css)\b/.test(userText);
  const hasBackend = /\b(backend|back end|api|node|express|server|database|sql)\b/.test(userText);
  const hasProject = /\b(project|built|build|internship|app|website|platform)\b/.test(userText);
  const hasRoleWords = /\b(role|prefer|enjoy|interest|excite|like)\b/.test(userText);
  const hasMl = /\b(ml|machine learning|ai|data science|prediction|neural)\b/.test(userText);

  const candidates = [];

  if (hasFrontend && !hasBackend) {
    candidates.push(PLACEMENTS_THEME_QUESTIONS.frontendDepth);
  }
  if (hasBackend && !hasFrontend) {
    candidates.push(PLACEMENTS_THEME_QUESTIONS.backendDepth);
  }
  if (hasFrontend && hasBackend) {
    candidates.push(PLACEMENTS_THEME_QUESTIONS.fullstackBalance);
  }
  if (!hasProject) {
    candidates.push(PLACEMENTS_THEME_QUESTIONS.projectSpecific);
  }
  if (!hasRoleWords) {
    candidates.push(PLACEMENTS_THEME_QUESTIONS.rolePreference);
  }
  if (hasMl) {
    candidates.push(PLACEMENTS_THEME_QUESTIONS.mlDepth);
  }

  return candidates;
};

const higherStudiesSignalCandidates = (userText = '') => {
  const hasTarget = /\b(gre|gate|ielts|mba|abroad|india|admission|exam)\b/.test(userText);
  const hasSubject = /\b(research|systems|security|data|cs|computer science|analytics)\b/.test(userText);
  const hasOutcome = /\b(research|industry|leadership|job|phd|engineer)\b/.test(userText);
  const hasPrep = /\b(hours|time|schedule|prep|preparation|weekly|consistency)\b/.test(userText);

  const candidates = [];
  if (!hasTarget) candidates.push(HIGHER_STUDIES_THEME_QUESTIONS.targetType);
  if (!hasSubject) candidates.push(HIGHER_STUDIES_THEME_QUESTIONS.subjectFocus);
  if (!hasOutcome) candidates.push(HIGHER_STUDIES_THEME_QUESTIONS.outcomeGoal);
  if (!hasPrep) candidates.push(HIGHER_STUDIES_THEME_QUESTIONS.examReadiness);

  return candidates;
};

const entrepreneurshipSignalCandidates = (userText = '') => {
  const hasStart = /\b(customer|problem|product|growth|sales|marketing)\b/.test(userText);
  const hasFunction = /\b(product|growth|finance|operations|legal|fundraising)\b/.test(userText);
  const hasExecution = /\b(experiment|validate|plan|execute|iterate|build)\b/.test(userText);
  const hasRunway = /\b(mvp|validate|demand|prototype)\b/.test(userText);

  const candidates = [];
  if (!hasStart) candidates.push(ENTREPRENEURSHIP_THEME_QUESTIONS.startingPoint);
  if (!hasFunction) candidates.push(ENTREPRENEURSHIP_THEME_QUESTIONS.functionalFit);
  if (!hasExecution) candidates.push(ENTREPRENEURSHIP_THEME_QUESTIONS.executionStyle);
  if (!hasRunway) candidates.push(ENTREPRENEURSHIP_THEME_QUESTIONS.runwaySignal);

  return candidates;
};

const buildFollowUpPrompt = (careerPath, messages = [], userTurns) => {
  const options = DOMAIN_OPTIONS[careerPath] || DOMAIN_OPTIONS.placements;
  const formattedConversation = messages
    .slice(-10)
    .map((msg) => `${msg.role === 'assistant' ? 'Advisor' : 'Student'}: ${String(msg.content || '').trim()}`)
    .join('\n');

  return [
    `You are an expert career counselor for the ${careerPath} track.`,
    `Allowed domain set: ${options.join(', ')}.`,
    `Current user turn count is ${userTurns}.`,
    'Ask exactly ONE short, natural, non-leading follow-up question.',
    'Do not mention confidence, recommendation, or JSON.',
    'Avoid repeatedly steering to ML unless user explicitly shows ML interest.',
    'Cover missing signals like preferred tasks, role style, projects, and motivations.',
    'Keep it concise (max 24 words).',
    'Conversation so far:',
    formattedConversation || 'No prior messages.',
  ].join('\n');
};

const generateGroqFollowUp = async (careerPath, messages, userTurns) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content: buildFollowUpPrompt(careerPath, messages, userTurns),
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return null;
    }

    const reply = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!reply) return null;

    return reply.replace(/\s+/g, ' ');
  } catch {
    return null;
  }
};

const askAdaptiveFollowUp = (careerPath, messages = [], userTurns = 0) => {
  const pool = FOLLOW_UP_QUESTIONS[careerPath] || FOLLOW_UP_QUESTIONS.placements;
  const userText = collectUserText(messages);
  const askedSet = collectAssistantQuestions(messages);

  let signalCandidates = [];
  if (careerPath === 'placements') {
    signalCandidates = placementSignalCandidates(userText);
  } else if (careerPath === 'higher-studies') {
    signalCandidates = higherStudiesSignalCandidates(userText);
  } else {
    signalCandidates = entrepreneurshipSignalCandidates(userText);
  }

  const prioritized = pickFirstUnasked(signalCandidates, askedSet);
  if (prioritized) {
    return prioritized;
  }

  for (let offset = 0; offset < pool.length; offset += 1) {
    const index = (userTurns + offset) % pool.length;
    const candidate = pool[index];
    if (!askedSet.has(String(candidate).trim().toLowerCase())) {
      return candidate;
    }
  }

  return pool[userTurns % pool.length];
};

const scoreOptions = (careerPath, userText, messages = []) => {
  const optionKeywords = KEYWORD_WEIGHTS[careerPath] || KEYWORD_WEIGHTS.placements;
  const mlPenalty = careerPath === 'placements' ? computeMlPenalty(messages) : 0;
  const hasFrontend = userText.includes('frontend');
  const hasBackend = userText.includes('backend');
  const hasFullStackPhrase = userText.includes('full stack') || userText.includes('fullstack');

  return Object.entries(optionKeywords).map(([option, keywords]) => {
    let score = 0;
    const matched = [];

    keywords.forEach((keyword) => {
      if (userText.includes(keyword.toLowerCase())) {
        score += keyword.includes(' ') ? 3 : 2;
        matched.push(keyword);
      }
    });

    if (careerPath === 'placements' && option === 'Fullstack') {
      if (hasFrontend && hasBackend) score += 4;
      if (hasFullStackPhrase) score += 3;
    }

    if (careerPath === 'placements' && option === 'ML' && mlPenalty > 0) {
      score = Math.max(0, score - mlPenalty);
    }

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
  const scored = scoreOptions(careerPath, userText, messages).sort((a, b) => b.score - a.score);

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
    evidenceScore: top?.score || 0,
  };
};

export async function chatWithGroq(req, res) {
  try {
    const { messages, careerPath } = req.body;
    const safeMessages = Array.isArray(messages) ? messages : [];
    const safeCareerPath = DOMAIN_OPTIONS[careerPath] ? careerPath : 'placements';
    const userTurns = countUserTurns(safeMessages);

    if (userTurns < MIN_USER_TURNS_FOR_RECOMMENDATION) {
      const groqQuestion = await generateGroqFollowUp(safeCareerPath, safeMessages, userTurns);
      return res.json({
        isRecommendation: false,
        reply: groqQuestion || askAdaptiveFollowUp(safeCareerPath, safeMessages, userTurns),
      });
    }

    const recommendation = buildRecommendation(safeCareerPath, safeMessages);

    if (recommendation.evidenceScore < 2 && userTurns < 6) {
      const groqQuestion = await generateGroqFollowUp(safeCareerPath, safeMessages, userTurns);
      return res.json({
        isRecommendation: false,
        reply: groqQuestion || askAdaptiveFollowUp(safeCareerPath, safeMessages, userTurns),
      });
    }

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
