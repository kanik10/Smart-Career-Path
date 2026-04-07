// Domain-specific topic lists for Smart Career Path
export const DOMAIN_TOPICS = {
  placements: [
    'DSA',
    'Operating Systems',
    'DBMS',
    'Computer Networks',
    'System Design',
    'HR Questions',
    'Aptitude',
  ],
  higher_studies: [
    'Quantitative Aptitude',
    'Verbal Reasoning',
    'Research Methods',
    'Statement of Purpose',
    'Subject GRE Topics',
    'GATE Subjects',
  ],
  entrepreneurship: [
    'Business Models',
    'Market Sizing',
    'Startup Finance',
    'Product Thinking',
    'Pitching',
    'Growth Strategies',
  ],
};

// Stage configuration - 4 stages per domain
export const STAGE_CONFIG = [
  {
    id: 1,
    name: 'Foundation',
    description: 'Start your journey',
    icon: '🏁',
  },
  {
    id: 2,
    name: 'Intermediate',
    description: 'Build your skills',
    icon: '📈',
  },
  {
    id: 3,
    name: 'Advanced',
    description: 'Master the concepts',
    icon: '⚡',
  },
  {
    id: 4,
    name: 'Master',
    description: 'Become an expert',
    icon: '👑',
  },
];

// Mini-games configuration
export const MINIGAMES = [
  {
    id: 'sprint',
    label: 'Sprint Quiz',
    xp: 50,
    route: '/gamification/sprint',
    icon: '⚡',
    color: '#FF6B35',
    description: 'Quick 10-question quiz in 30 seconds',
  },
  {
    id: 'spin',
    label: 'Spin the Wheel',
    xp: 40,
    route: '/gamification/spin',
    icon: '🎡',
    color: '#F7931E',
    description: 'Spin, pick a topic, answer 5 quick questions',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    xp: 30,
    route: '/gamification/flashcards',
    icon: '🃏',
    color: '#FFB703',
    description: 'Memory matching - flip cards and find pairs',
  },
  {
    id: 'boss_battle',
    label: 'Boss Battle',
    xp: 100,
    route: '/gamification/boss-battle',
    icon: '⚔️',
    color: '#FB5607',
    description: 'Defeat a boss with 5 progressively harder questions',
  },
];

// XP configuration
export const XP_PER_LEVEL = 1000;
export const XP_PERFECT_BONUS = 20;

// XP per game type (before bonus)
export const GAME_XP_REWARDS = {
  sprint: 50,
  spin: 40,
  flashcards: 30,
  boss_battle: 100,
};

// Badge definitions
export const BADGES = [
  {
    id: 'first_step',
    name: 'First Step',
    icon: '👣',
    description: 'Complete your first game',
    condition: 'completedGames >= 1',
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    icon: '🔥',
    description: 'Maintain a 7-day streak',
    condition: 'streakDays >= 7',
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    icon: '⚔️',
    description: 'Complete Boss Battle with perfect score',
    condition: 'perfectBossBattle',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    icon: '💯',
    description: 'Earn 100 XP',
    condition: 'totalXp >= 100',
  },
  {
    id: 'level_5',
    name: 'Level Up',
    icon: '🚀',
    description: 'Reach level 5',
    condition: 'level >= 5',
  },
  {
    id: 'all_games',
    name: 'Game Master',
    icon: '🎮',
    description: 'Complete all 4 game types',
    condition: 'completedAllGameTypes',
  },
];

// Color scheme matching Register.jsx theme
export const THEME = {
  primary: '#6B46C1', // purple
  primaryLight: '#9F7AEA', // lighter purple
  primaryDark: '#5A38A3', // darker purple
  success: '#48BB78', // green
  error: '#F56565', // red
  warning: '#ED8936', // orange
  info: '#4299E1', // blue
  background: '#F5F3FF', // very light purple
  text: '#2D3748', // dark gray
  textLight: '#718096', // medium gray
};

// Get topics for a specific stage
export const getStageTopics = (domain, stageId) => {
  const topics = DOMAIN_TOPICS[domain] || DOMAIN_TOPICS.placements;
  const topicsPerStage = Math.ceil(topics.length / 4);
  const start = (stageId - 1) * topicsPerStage;
  const end = start + topicsPerStage;
  return topics.slice(start, end);
};

// Get stage name with topics
export const getStageName = (domain, stageId) => {
  const stage = STAGE_CONFIG[stageId - 1];
  const topics = getStageTopics(domain, stageId);
  return `${stage.name}: ${topics.join(', ')}`;
};
