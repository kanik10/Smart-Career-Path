import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Flame, Trophy } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';
import { THEME, XP_PER_LEVEL } from './gamificationConfig';
import './gamificationHub.css';

function getInitials(name) {
  if (!name) return 'SC';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatXp(value) {
  return Number(value || 0).toLocaleString();
}

function buildWeeklyCompletion(streakDays) {
  const days = [
    { day: 'M', completed: false },
    { day: 'T', completed: false },
    { day: 'W', completed: false },
    { day: 'T', completed: false },
    { day: 'F', completed: false },
    { day: 'S', completed: false },
    { day: 'S', completed: false },
  ];

  const today = new Date();
  const jsDay = today.getDay();
  const mondayBasedToday = jsDay === 0 ? 6 : jsDay - 1;
  const completedCount = Math.min(Number(streakDays || 0), 7);

  for (let i = 0; i < completedCount; i += 1) {
    const idx = (mondayBasedToday - i + 7) % 7;
    days[idx].completed = true;
  }

  return days;
}

export default function GamificationHub() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { careerPath = 'placements', name = 'Student', profileImage = '' } = userInfo;

  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, leaderboardData] = await Promise.all([
          gamificationService.getProfile(),
          gamificationService.getLeaderboard(),
        ]);

        setProfile(profileData);
        setLeaderboard(leaderboardData.leaders || []);
      } catch (err) {
        console.error('Failed to load gamification hub:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalXp = profile?.totalXp || 0;
  const xpPerLevel = profile?.xpPerLevel || XP_PER_LEVEL;
  const currentLevel = Math.floor(totalXp / xpPerLevel) + 1;
  const xpInLevel = typeof profile?.xpProgress === 'number' ? profile.xpProgress : totalXp % xpPerLevel;
  const xpForNextLevel = typeof profile?.xpForNextLevel === 'number' ? profile.xpForNextLevel : xpPerLevel - xpInLevel;
  const progressPercent = xpPerLevel > 0 ? (xpInLevel / xpPerLevel) * 100 : 0;
  const streakDays = profile?.streakDays || 0;
  const weeklyCompletion = useMemo(() => buildWeeklyCompletion(streakDays), [streakDays]);
  const podium = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const podiumMap = {
    1: podium[0],
    2: podium[1],
    3: podium[2],
  };

  if (loading) {
    return (
      <div className="gamification-hub loading">
        <div className="spinner"></div>
        <p>Loading your arena...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gamification-hub error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="gamification-hub-shell">
      <div className="gamification-hub">
        <div className="gh-top-grid">
          <section className="gh-card gh-profile-card">
            <div className="gh-profile-row">
              <div className="gh-profile-main">
                <div className="gh-avatar-ring">
                  <div className="gh-avatar">
                    {profileImage ? (
                      <img src={`http://localhost:5000${profileImage}`} alt={name} className="gh-avatar-image" />
                    ) : (
                      getInitials(name)
                    )}
                  </div>
                </div>
                <div className="gh-profile-text">
                  <p className="gh-kicker">Player Profile</p>
                  <h1>{name}</h1>
                  <div className="gh-profile-badges">
                    <span className="gh-pill gh-pill-level">Level {currentLevel}</span>
                    <span className="gh-pill gh-pill-streak">
                      <Flame size={14} />
                      {streakDays} day streak
                    </span>
                  </div>
                </div>
              </div>

              <div className="gh-arena-cta-wrap">
                <Link to="/gamification/arena" state={{ domain: careerPath }} className="gh-arena-cta">
                  <span>Enter Game Arena</span>
                  <ArrowRight size={18} />
                </Link>
                <p>Jump into challenges, boss battles, and weekly progression.</p>
              </div>
            </div>

            <div className="gh-xp-panel">
              <div className="gh-xp-heading-row">
                <div>
                  <p className="gh-xp-label">Current XP</p>
                  <p className="gh-xp-value">{formatXp(totalXp)} XP</p>
                </div>
                <p className="gh-xp-next">
                  {formatXp(xpInLevel)} / {formatXp(xpPerLevel)} in this level
                </p>
              </div>
              <div className="gh-xp-track">
                <div className="gh-xp-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="gh-xp-needed">{formatXp(xpForNextLevel)} XP needed to level up</p>
            </div>
          </section>

          <section className="gh-card gh-streak-card">
            <div className="gh-card-header">
              <div>
                <h2>Weekly Streak</h2>
                <p>Stay active across the week to keep your streak alive.</p>
              </div>
              <Flame className={streakDays > 0 ? 'is-burning' : ''} size={18} />
            </div>

            <div className="gh-streak-main">
              <div>
                <p className="gh-streak-days">{streakDays}</p>
                <p className="gh-streak-sub">current streak days</p>
              </div>
              <div className="gh-momentum-chip">
                <p>Momentum</p>
                <span>Keep earning XP daily</span>
              </div>
            </div>

            <div className="gh-week-grid">
              {weeklyCompletion.map((entry, idx) => (
                <div key={`${entry.day}-${idx}`} className={`gh-day-dot ${entry.completed ? 'done' : ''}`}>
                  {entry.day}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="gh-bottom-grid">
          <section className="gh-card gh-leaderboard-card">
            <div className="gh-card-header">
              <div>
                <h2>Weekly Leaderboard</h2>
                <p>Ranked by XP earned this week.</p>
              </div>
              <Crown size={18} />
            </div>

            <div className="gh-divider" />

            <div className="gh-leaderboard-list">
              {!loading && leaderboard.length === 0 && (
                <div className="gh-empty-block">No weekly leaderboard data yet.</div>
              )}

              {leaderboard.map((entry, index) => (
                <div key={`${entry.userId}-${entry.rank || index}`} className="gh-leaderboard-item">
                  <div className="gh-rank-circle">{entry.rank || index + 1}</div>
                  <div className="gh-leader-user">
                    <p className="gh-leader-name">{entry.name}</p>
                    <span>Level {entry.level || 1}</span>
                  </div>
                  <p className="gh-leader-xp">{formatXp(entry.weeklyXp)} XP</p>
                </div>
              ))}
            </div>
          </section>

          <section className="gh-card gh-podium-card">
            <div className="gh-card-header">
              <div>
                <h2>Top 3 Podium</h2>
                <p>This week&apos;s front-runners.</p>
              </div>
              <Trophy size={18} />
            </div>

            <div className="gh-divider" />

            <div className="gh-podium-stage">
              {[2, 1, 3].map((place) => {
                const entry = podiumMap[place];
                return (
                  <div className="gh-podium-col" key={place}>
                    <div className="gh-podium-avatar">
                      {entry ? (
                        entry.profileImage ? (
                          <img
                            src={`http://localhost:5000${entry.profileImage}`}
                            alt={entry.name}
                            className="gh-podium-avatar-image"
                          />
                        ) : (
                          <span>{getInitials(entry.name)}</span>
                        )
                      ) : (
                        <span>#{place}</span>
                      )}
                    </div>
                    <div className="gh-podium-name">{entry ? entry.name : `Rank ${place}`}</div>
                    <div className={`gh-pedestal gh-place-${place}`}>
                      {entry ? (
                        <>
                          <strong>{entry.name}</strong>
                          <span>{formatXp(entry.weeklyXp)} XP</span>
                        </>
                      ) : (
                        <span>#{place}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {error && (
          <div className="gh-inline-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
