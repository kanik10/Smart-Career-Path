import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Domain-specific context for questions
const domainContexts = {
  placements: {
    description: 'Career preparation and job placement focused questions',
    focus: 'interview prep, technical skills, problem-solving for job roles',
  },
  higher_studies:
  {
    description: 'Academic advancement and research-focused content',
    focus: 'theoretical concepts, research methodologies, advanced topics',
  },
  entrepreneurship: {
    description: 'Business and startup-focused questions',
    focus: 'innovation, business strategy, product development, market analysis',
  },
};

const parseModelJson = (rawText) => {
  const text = String(rawText || '').trim();
  if (!text) throw new Error('Empty model response');

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : text;

  try {
    return JSON.parse(candidate);
  } catch {
    const objectStart = candidate.indexOf('{');
    const objectEnd = candidate.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd > objectStart) {
      const objSlice = candidate.slice(objectStart, objectEnd + 1);
      try {
        return JSON.parse(objSlice);
      } catch {
        // continue
      }
    }

    const arrayStart = candidate.indexOf('[');
    const arrayEnd = candidate.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      const arrSlice = candidate.slice(arrayStart, arrayEnd + 1);
      return JSON.parse(arrSlice);
    }

    throw new Error('Unable to parse model JSON');
  }
};

const placementsBossFallback = {
  Easy: [
    { question: 'If a shirt priced at 100 gets a 20% discount, what is the selling price?', options: ['80', '120', '75', '85'], correctAnswer: 0 },
    { question: 'What is 15% of 200?', options: ['30', '25', '35', '40'], correctAnswer: 0 },
    { question: 'Average of 10, 20, 30 is:', options: ['20', '15', '25', '30'], correctAnswer: 0 },
    { question: 'A train covers 60 km in 1 hour. Its speed is:', options: ['60 km/h', '50 km/h', '70 km/h', '55 km/h'], correctAnswer: 0 },
    { question: 'If ratio of boys:girls is 3:2 and girls are 20, boys are:', options: ['30', '25', '35', '40'], correctAnswer: 0 },
    { question: 'Simple interest on 1000 at 10% for 1 year is:', options: ['100', '90', '110', '120'], correctAnswer: 0 },
    { question: 'Find the odd one out: 2, 4, 8, 16, 18', options: ['18', '16', '8', '4'], correctAnswer: 0 },
    { question: 'If 5 workers finish a task in 10 days, work is measured as:', options: ['50 worker-days', '40 worker-days', '60 worker-days', '45 worker-days'], correctAnswer: 0 },
  ],
  Medium: [
    { question: 'Statement: All engineers are logical. Some logical people are artists. Conclusion: Some engineers are artists.', options: ['Does not follow', 'Follows', 'Either follows or not', 'Cannot be determined from first statement only'], correctAnswer: 0 },
    { question: 'Find next term: 2, 6, 12, 20, 30, ?', options: ['42', '40', '44', '46'], correctAnswer: 0 },
    { question: 'In a code, CAT = 24 and DOG = 26. What is BAT?', options: ['23', '22', '24', '21'], correctAnswer: 0 },
    { question: 'If A is north of B, B is east of C, C is south of D. Where is A from D?', options: ['South-East', 'North-East', 'North-West', 'South-West'], correctAnswer: 0 },
    { question: 'Choose the correct mirror relation for LEFT and ? (conceptual)', options: ['TFEL', 'LEFT', 'LFET', 'TELF'], correctAnswer: 0 },
    { question: 'A, C, F, J, O, ? (alphabet positions)', options: ['U', 'T', 'V', 'W'], correctAnswer: 0 },
    { question: 'Five people sit in a row. P is left of Q and right of R. R is left of S. Who is second from left?', options: ['R', 'P', 'Q', 'S'], correctAnswer: 0 },
    { question: 'If 3x + 2 = 20 and 2y = x, then y = ?', options: ['3', '4', '2', '5'], correctAnswer: 0 },
    { question: 'A is brother of B, B is mother of C. A is what to C?', options: ['Uncle', 'Brother', 'Father', 'Cousin'], correctAnswer: 0 },
    { question: 'Which one is not a logical operator?', options: ['Multiply', 'AND', 'OR', 'NOT'], correctAnswer: 0 },
  ],
  Hard: [
    { question: 'A can do a job in 12 days, B in 18 days. They work together 4 days, then A leaves. Remaining work done by B in?', options: ['6 days', '5 days', '7 days', '8 days'], correctAnswer: 0 },
    { question: 'If CI on 1000 at 10% for 2 years is asked, value is:', options: ['210', '200', '220', '230'], correctAnswer: 0 },
    { question: 'A mixture has milk:water = 7:3. If 10 liters water added to 50 liters mixture, new ratio is?', options: ['7:5', '3:2', '4:3', '5:4'], correctAnswer: 0 },
    { question: 'Data interpretation: If sales in Q1,Q2,Q3 are 100,120,90 then % increase Q1 to Q2 is?', options: ['20%', '15%', '25%', '30%'], correctAnswer: 0 },
    { question: 'Permutation: Number of ways to arrange letters of LEVEL is?', options: ['30', '60', '120', '20'], correctAnswer: 0 },
    { question: 'Probability of getting exactly one head in two coin tosses is:', options: ['1/2', '1/4', '3/4', '1/3'], correctAnswer: 0 },
    { question: 'If f(x)=2x^2-3x+1, then f(3)=?', options: ['10', '8', '12', '9'], correctAnswer: 0 },
    { question: 'A code lock uses 4 digits without repetition from 0-9. Total combinations:', options: ['5040', '10000', '720', '3024'], correctAnswer: 0 },
    { question: 'Two pipes fill tank in 20 and 30 mins, outlet empties in 60 mins. Net fill time?', options: ['15 mins', '12 mins', '18 mins', '20 mins'], correctAnswer: 0 },
    { question: 'In a class, 60% like math, 45% like science, 25% both. % liking at least one:', options: ['80%', '70%', '75%', '85%'], correctAnswer: 0 },
    { question: 'Sequence: 3, 7, 15, 31, 63, ? ', options: ['127', '95', '111', '131'], correctAnswer: 0 },
    { question: 'A sum doubles in 5 years at simple interest. In how many years will it triple?', options: ['10 years', '12 years', '15 years', '8 years'], correctAnswer: 0 },
  ],
};

const buildBossFallbackByDomain = (domain, topic) => {
  if (domain === 'placements') {
    return {
      phases: [
        { name: 'Easy', questions: placementsBossFallback.Easy.map((q, i) => ({ id: i + 1, ...q })) },
        { name: 'Medium', questions: placementsBossFallback.Medium.map((q, i) => ({ id: i + 1, ...q })) },
        { name: 'Hard', questions: placementsBossFallback.Hard.map((q, i) => ({ id: i + 1, ...q })) },
      ],
    };
  }

  const build = (difficulty, count) =>
    Array.from({ length: count }).map((_, idx) => ({
      id: idx + 1,
      question: `${difficulty} ${topic} question ${idx + 1}: choose the best domain-appropriate answer.`,
      options: [
        `Most accurate ${topic} reasoning`,
        `Common mistake in ${topic}`,
        `Partially correct but incomplete choice`,
        `Irrelevant distractor`,
      ],
      correctAnswer: 0,
    }));

  return {
    phases: [
      { name: 'Easy', questions: build('Easy', 8) },
      { name: 'Medium', questions: build('Medium', 10) },
      { name: 'Hard', questions: build('Hard', 12) },
    ],
  };
};

// Sprint Quiz: 10 timed MCQs (30-60 seconds total)
export const generateSprintQuestions = async (domain, topic) => {
  const context = domainContexts[domain];

  const prompt = `Generate 5 multiple-choice questions for a "Sprint Quiz" game focused on the topic "${topic}" in the context of "${domain}".
Context: ${context.description}
Focus: ${context.focus}

Format the response as a valid JSON array of objects with this exact structure:
[
  {
    "id": 1,
    "question": "question text here",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": 0
  }
]

Requirements:
- Each question should be answerable in 6-10 seconds
- Difficulty: Easy (beginner-friendly)
- If domain is placements: prefer campus placement style questions (aptitude basics, resume basics, interview basics, beginner DSA basics)
- Options should be plausible but clearly differentiated
- Every question stem must be unique (no repetition)
- Provide exactly 4 meaningful options per question
- Do not use placeholder option text like "Option A", "Option 1", "None"
- Correct answer index is 0-3

Return ONLY valid JSON, no markdown, no extra text.`;

  try {
    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return parseModelJson(content);
  } catch (error) {
    console.error('Error generating sprint questions:', error);
    // Return fallback questions
    return [
      {
        id: 1,
        question: `For placement prep in ${topic}, what should a beginner do first?`,
        options: [
          'Revise basics and solve easy problems daily',
          'Start only with the hardest problems',
          'Avoid aptitude practice',
          'Skip mock interviews',
        ],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'In campus placements, what does HR usually check first?',
        options: [
          'Communication and clarity',
          'Complex system design only',
          'Open-source stars only',
          'Advanced research publications',
        ],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'What is the best way to improve aptitude speed for placements?',
        options: [
          'Timed practice with shortcuts and review',
          'Memorize random formulas only',
          'Practice once a week',
          'Ignore wrong answers',
        ],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'For coding rounds, what is a good beginner strategy?',
        options: [
          'Start with arrays, strings, and basic logic',
          'Jump directly to advanced graphs only',
          'Avoid dry runs',
          'Never analyze time complexity',
        ],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'What should be included in a fresher resume for placements?',
        options: [
          'Relevant projects, skills, and measurable impact',
          'Unrelated personal details only',
          'No projects section',
          'Copied generic summaries',
        ],
        correctAnswer: 0,
      },
    ];
  }
};

// Flashcards: 10 concept cards (term + definition)
export const generateFlashcards = async (domain, topic) => {
  const context = domainContexts[domain];

  const prompt = `Generate 8 flashcard pairs for the topic "${topic}" in the context of "${domain}".
Context: ${context.description}
Focus: ${context.focus}

Format the response as a valid JSON array of objects with this exact structure:
[
  {
    "id": 1,
    "term": "concept or term",
    "definition": "clear definition or explanation"
  }
]

Requirements:
- Terms should be concise (1-3 words)
- Definitions should be 1-2 sentences, clear and memorable
- Difficulty: Medium, tailored to ${domain}
- Content should be relevant and practical
- No repeated term-definition pairs

Return ONLY valid JSON, no markdown, no extra text.`;

  try {
    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return parseModelJson(content);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return [
      {
        id: 1,
        term: topic,
        definition: `Core concept in ${domain} field.`,
      },
    ];
  }
};

// Boss Battle: Multi-turn MCQ challenge (3 phases: Easy, Medium, Hard)
// Each phase has questions with increasing difficulty
export const generateBossBattleQuestions = async (domain, topic) => {
  const context = domainContexts[domain];

  const placementsAptitudeGuidance =
    domain === 'placements'
      ? `
Special rule for placements aptitude progression:
- Easy phase: basic aptitude (percentages, ratios, averages, simple arithmetic, direct reasoning)
- Medium phase: logic-based aptitude (arrangements, syllogisms, statements/assumptions, series)
- Hard phase: high-level aptitude (multi-step quantitative reasoning, data interpretation, advanced logic)
`
      : '';

  const prompt = `Generate boss battle questions for 3 phases (Easy, Medium, Hard) on topic "${topic}" in context of "${domain}".
Context: ${context.description}
Focus: ${context.focus}
${placementsAptitudeGuidance}

Format response as valid JSON with this exact structure:
{
  "phases": [
    {
      "name": "Easy",
      "questions": [
        {
          "id": 1,
          "question": "question text",
          "options": ["a", "b", "c", "d"],
          "correctAnswer": 0
        }
      ]
    },
    {
      "name": "Medium",
      "questions": [...]
    },
    {
      "name": "Hard",
      "questions": [...]
    }
  ]
}

Requirements:
- Easy: 8 questions, foundational concepts
- Medium: 10 questions, applied and logic-oriented knowledge
- Hard: 12 questions, high-difficulty multi-step reasoning
- For ${domain} context
- Options must be distinct and plausible
- Provide exactly 4 options for every question
- Do not repeat question stems across phases
- Do not use placeholder options like "Option A/B/C/D"

Return ONLY valid JSON, no markdown, no extra text.`;

  try {
    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = parseModelJson(content);
    const phaseCount = Array.isArray(parsed?.phases) ? parsed.phases.length : 0;
    if (phaseCount < 3) {
      throw new Error('Boss phases were incomplete');
    }
    return parsed;
  } catch (error) {
    console.error('Error generating boss battle questions:', error);
    return buildBossFallbackByDomain(domain, topic);
  }
};

// Spin Wheel: 5 quick MCQs from a spun topic
export const generateSpinQuestions = async (domain, spinTopic) => {
  const context = domainContexts[domain];

  const prompt = `Generate 5 quick multiple-choice questions on "${spinTopic}" for a spin-the-wheel game in "${domain}".
Context: ${context.description}

Format response as valid JSON array:
[
  {
    "id": 1,
    "question": "question text",
    "options": ["a", "b", "c", "d"],
    "correctAnswer": 0
  }
]

Requirements:
- 5 questions total
- Quick to answer (8-15 seconds each)
- Difficulty: Medium
- If domain is placements: prioritize campus-placement style questions (interview prep, aptitude logic, DSA fundamentals, core CS basics)
- All on the topic "${spinTopic}"
- Fun and engaging
- No repeated question stems
- Exactly 4 distinct options per question
- Do not use placeholder options like "Option 1"

Return ONLY valid JSON, no markdown, no extra text.`;

  try {
    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return parseModelJson(content);
  } catch (error) {
    console.error('Error generating spin questions:', error);
    return [
      {
        id: 1,
        question: `Quick question about ${spinTopic}?`,
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 0,
      },
    ];
  }
};

// Utility: Generate a list of topics for a domain and stage
// (This helps frontend populate the spin wheel)
export const generateDomainTopics = async (domain, stageId) => {
  const stageNames = {
    1: 'Fundamentals',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
  };

  const prompt = `Generate 8 relevant topics for stage ${stageId} (${stageNames[stageId]}) in the "${domain}" context.
Focus: practical, engaging topics suitable for gamification.

Format: Return a JSON array of strings.
["topic1", "topic2", ...]

Examples for placements: ["Resume Building", "Interview Tips", "DSA Problems"]
Examples for higher_studies: ["Research Methods", "Literature Review", "Thesis Writing"]
Examples for entrepreneurship: ["Startup Ideas", "Business Model", "Fundraising"]

Return ONLY valid JSON array, no markdown.`;

  try {
    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return parseModelJson(content);
  } catch (error) {
    console.error('Error generating domain topics:', error);
    // Fallback topics
    const fallbacks = {
      placements: [
        'Resume Building',
        'Interview Tips',
        'DSA Problems',
        'Coding Patterns',
        'Behavioral Questions',
        'Negotiation Skills',
      ],
      higher_studies: [
        'Research Methods',
        'Literature Review',
        'Thesis Writing',
        'Data Analysis',
        'Academic Writing',
        'Publication Process',
      ],
      entrepreneurship: [
        'Business Model',
        'Market Analysis',
        'Fundraising',
        'Product Strategy',
        'Customer Acquisition',
        'Financial Planning',
      ],
    };
    return fallbacks[domain] || fallbacks.placements;
  }
};
