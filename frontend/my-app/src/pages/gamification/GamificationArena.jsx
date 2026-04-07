import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamificationService } from '../../services/gamificationService';
import { getStageTopics } from './gamificationConfig';
import './gamificationArena.css';

const WEEKLY_STAGE_TOPICS = {
  placements: [
    { title: 'Week 1: Aptitude & Quant', topics: ['Aptitude', 'Quantitative Reasoning'] },
    { title: 'Week 2: DSA Patterns', topics: ['Arrays', 'Strings', 'Hashing'] },
    { title: 'Week 3: Core CS Fundamentals', topics: ['OS', 'DBMS', 'Computer Networks'] },
    { title: 'Week 4: Interview Readiness', topics: ['HR Questions', 'Mock Interviews', 'Resume Review'] },
  ],
  higher_studies: [
    { title: 'Week 1: Exam Foundations', topics: ['GRE Basics', 'Quantitative Aptitude'] },
    { title: 'Week 2: Verbal & Logic', topics: ['Verbal Reasoning', 'Critical Reading'] },
    { title: 'Week 3: Research Readiness', topics: ['Research Methods', 'Literature Review'] },
    { title: 'Week 4: Application Prep', topics: ['SOP', 'University Shortlisting', 'LOR Planning'] },
  ],
  entrepreneurship: [
    { title: 'Week 1: Startup Basics', topics: ['Problem Validation', 'Idea Framing'] },
    { title: 'Week 2: Product & Customer', topics: ['MVP Design', 'User Research'] },
    { title: 'Week 3: Finance & Growth', topics: ['Unit Economics', 'Growth Channels'] },
    { title: 'Week 4: Pitch & Execution', topics: ['Pitch Deck', 'Fundraising', 'Go-To-Market'] },
  ],
};

const ARENA_STAGES = [
  { id: 1, name: 'Data Structures', stageKey: 'data_structures', flowerImage: '/gamification/arena/nodes/flower-ds.png' },
  { id: 2, name: 'Analysis of Algorithms', stageKey: 'analysis_of_algorithms', flowerImage: '/gamification/arena/nodes/flower-algo.png' },
  { id: 3, name: 'Computer Networks', stageKey: 'computer_networks', flowerImage: '/gamification/arena/nodes/flower-cn.png' },
  { id: 4, name: 'Operating Systems', stageKey: 'operating_systems', flowerImage: '/gamification/arena/nodes/flower-os.png' },
];

const ARENA_GAMES = [
  {
    id: 'sprint',
    label: 'Sprint Quiz',
    icon: '/gamification/minigames/sprint.png',
    xp: '100 XP',
    route: '/gamification/sprint',
  },
  {
    id: 'spin',
    label: 'Spin the Wheel',
    icon: '/gamification/minigames/wheel.png',
    xp: '100 XP',
    route: '/gamification/spin',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: '/gamification/minigames/flashcards.png',
    xp: '200 XP',
    route: '/gamification/flashcards',
  },
  {
    id: 'boss_battle',
    label: 'Boss Battle',
    icon: '/gamification/minigames/boss.png',
    xp: '300 XP',
    route: '/gamification/boss-battle',
  },
];

const getInitials = (name) => {
  if (!name) return 'ST';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const toCompletedCount = (stage) => {
  if (!stage) return 0;
  if (Array.isArray(stage.completedGames)) return stage.completedGames.length;
  return Number(stage.completedGames || 0);
};

const toProgressPercent = (stage) => {
  if (!stage) return 0;
  if (typeof stage.progress === 'number') return Math.max(0, Math.min(100, Math.round(stage.progress)));
  return Math.round((toCompletedCount(stage) / 4) * 100);
};

export default function GamificationArena() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { careerPath = 'placements', name = 'Student', profileImage = '' } = userInfo;

  const [stageProgress, setStageProgress] = useState([]);
  const [activeStageId, setActiveStageId] = useState(1);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [progressData, profileData] = await Promise.all([
          gamificationService.getStageProgress(careerPath),
          gamificationService.getProfile(),
        ]);

        setStageProgress(progressData.stages || []);
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load arena:', err);
        setError('Failed to load arena. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [careerPath]);

  const stageMap = useMemo(() => {
    const map = {};
    stageProgress.forEach((stage) => {
      map[stage.stageId] = stage;
    });
    return map;
  }, [stageProgress]);

  const domainWeeks = WEEKLY_STAGE_TOPICS[careerPath] || WEEKLY_STAGE_TOPICS.placements;

  const getStage = (stageId) => {
    const stage = stageMap[stageId];
    if (stage) return stage;
    return {
      stageId,
      completedGames: [],
      progress: 0,
      dropletsRemaining: 4,
      isUnlocked: stageId === 1,
    };
  };

  const maxXPForLevel = 1000;
  const xp = profile?.totalXp || 0;
  const level = Math.floor(xp / maxXPForLevel) + 1;
  const xpProgress = ((xp % maxXPForLevel) / maxXPForLevel) * 100;

  const isGameUnlocked = (gameIndex, stageId) => {
    const completed = toCompletedCount(getStage(stageId));
    return completed >= gameIndex;
  };

  const isGameCompleted = (gameIndex, stageId) => {
    const completed = toCompletedCount(getStage(stageId));
    return completed > gameIndex;
  };

  const handleGameClick = (game, gameIndex) => {
    if (!isGameUnlocked(gameIndex, activeStageId)) return;
    const week = domainWeeks[activeStageId - 1];
    const stageTopic = week?.topics?.[0] || getStageTopics(careerPath, activeStageId)[0] || 'General';

    navigate(game.route, {
      state: {
        domain: careerPath,
        stageId: activeStageId,
        topic: stageTopic,
      },
    });
  };

  return (
    <div className="arena-page">
      {loading ? (
        <div className="arena-loading">
          <div className="arena-spinner" />
          <p>Loading Arena...</p>
        </div>
      ) : (
        <>
          <header className="arena-topbar">
            <div className="arena-topbar-inner">
              <div className="arena-user-wrap">
                <div className="arena-avatar">
                  {profileImage ? (
                    <img src={`http://localhost:5000${profileImage}`} alt={name} className="arena-avatar-image" />
                  ) : (
                    getInitials(name)
                  )}
                </div>
                <div className="arena-user-text">
                  <p>{name}</p>
                  <span>Level {level} - {xp} Total XP</span>
                </div>
              </div>

              <div className="arena-xp-wrap">
                <div className="arena-xp-labels">
                  <span>LEVEL {level} PROGRESS</span>
                  <strong>{xp % maxXPForLevel} / {maxXPForLevel} XP</strong>
                </div>
                <div className="arena-xp-track">
                  <div className="arena-xp-fill" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>

              <button className="arena-back-btn" onClick={() => navigate('/gamification')}>
                Back
              </button>
            </div>
          </header>

          <main className="arena-main">
            <section className="arena-map-column">
              <div className="arena-stage-list">
                {ARENA_STAGES.map((stage, index) => {
                  const week = domainWeeks[stage.id - 1];
                  const progress = getStage(stage.id);
                  const completed = toCompletedCount(progress);
                  const progressPercent = toProgressPercent(progress);
                  const dropletsRemaining = typeof progress.dropletsRemaining === 'number'
                    ? progress.dropletsRemaining
                    : Math.max(0, 4 - completed);
                  const isComplete = completed >= 4;
                  const isActive = activeStageId === stage.id;
                  const nodeImage = isComplete ? stage.flowerImage : '/gamification/arena/nodes/rock.png';

                  return (
                    <div key={stage.id} className="arena-stage-wrap">
                      <article
                        className={`arena-stage-node ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveStageId(stage.id)}
                      >
                        <div className="arena-stage-pill">{(week?.title || stage.name).toUpperCase()}</div>
                        {week?.topics?.length ? <div className="arena-stage-week-title">{week.topics.join(' • ')}</div> : null}

                        <div className="arena-droplets">
                          {dropletsRemaining > 0 ? (
                            Array.from({ length: dropletsRemaining }).map((_, i) => (
                              <img
                                key={`${stage.id}-drop-${i}`}
                                className="drop"
                                src="/gamification/arena/droplets/droplet.png"
                                alt="droplet"
                              />
                            ))
                          ) : (
                            <span className="arena-done-text">All droplets collected!</span>
                          )}
                        </div>

                        <div className="arena-stage-art">
                          <span className="arena-stage-number">{stage.id}</span>
                          <img className="arena-core-art" src={nodeImage} alt={isComplete ? stage.name : 'rock'} />
                          {isComplete && <div className="arena-complete-check">✓</div>}
                        </div>

                        <div className="arena-stage-meta">
                          <p>{completed} / 4 Games</p>
                          <span>{progressPercent}% Complete</span>
                        </div>
                      </article>

                      {index < ARENA_STAGES.length - 1 && (
                        <div className="arena-connector">
                          <div className="arena-connector-track" />
                          <div
                            className="arena-connector-fill"
                            style={{ height: `${toProgressPercent(progress)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <aside className="arena-panel-column">
              <div className="arena-games-panel">
                <h2>MINI GAMES</h2>
                <p>Stage: {domainWeeks[activeStageId - 1]?.title || ARENA_STAGES.find((s) => s.id === activeStageId)?.name}</p>

                <div className="arena-games-list">
                  {ARENA_GAMES.map((game, index) => {
                    const unlocked = isGameUnlocked(index, activeStageId);
                    const completed = isGameCompleted(index, activeStageId);
                    return (
                      <button
                        key={game.id}
                        className={`arena-game-item ${completed ? 'completed' : ''} ${
                          unlocked ? 'playable' : 'locked'
                        }`}
                        onClick={() => handleGameClick(game, index)}
                        disabled={!unlocked}
                      >
                        <div className="arena-game-icon">
                          <img src={game.icon} alt={game.label} />
                        </div>
                        <div className="arena-game-text">
                          <h3>{game.label}</h3>
                          <span>{game.xp}</span>
                        </div>

                        {completed ? <span className="arena-status done">↻</span> : null}
                        {!completed && !unlocked ? <span className="arena-status lock">🔒</span> : null}
                        {!completed && unlocked ? <span className="arena-status arrow">▸</span> : null}
                      </button>
                    );
                  })}
                </div>

                <div className="arena-note">
                  💡 <strong>Complete all 4 games</strong> in a stage to turn rock into flower!
                </div>
              </div>
            </aside>
          </main>

          {error && (
            <div className="arena-inline-error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
