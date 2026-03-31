// src/pages/Progress.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Target, Code, CheckCircle, Trophy, FileText, UploadCloud, Briefcase, FileBadge2, AlertTriangle, Sparkles } from 'lucide-react';
import './Progress.css';

// --- Milestones are now separated by category ---

const commonMilestones = [
  { id: "1", title: "Complete Profile Setup", description: "Add all required information to your profile", category: "Profile" },
  { id: "3", title: "Upload Resume", description: "Upload your latest resume to the portal", category: "Documents" },
  { id: "6", title: "Network with Alumni", description: "Connect with at least 3 VPPCOE alumni", category: "Networking" }
];

const placementsMilestones = [
  { id: "2", title: "Attend Mock Interview", description: "Participate in a practice interview session", category: "Interview Prep" },
  { id: "4", title: "Complete 5 Coding Challenges", description: "Solve algorithmic problems on platforms like LeetCode", category: "Technical Skills" },
  { id: "7", title: "Apply for 3 Internships", description: "Apply for at least three relevant internship opportunities", category: "Career" }
];

const higherStudiesMilestones = [
  { id: "hs1", title: "Take a Mock GRE/GATE Test", description: "Assess your current standing for entrance exams", category: "Exam Prep" },
  { id: "hs2", title: "Research 5 Universities", description: "Shortlist potential universities for your desired course", category: "Research" },
  { id: "hs3", title: "Draft Statement of Purpose (SOP)", description: "Write the first draft of your SOP", category: "Application" }
];

const entrepreneurshipMilestones = [
  { id: "e1", title: "Draft a Business Plan", description: "Create a one-page business plan for a startup idea", category: "Planning" },
  { id: "e2", title: "Attend a Startup Pitch Event", description: "Observe how founders pitch their ideas to investors", category: "Networking" },
  { id: "e3", title: "Read 'The Lean Startup'", description: "Understand the fundamentals of building a lean business", category: "Learning" }
];


export default function Progress() {
  const loadingMessages = [
    'Reading your resume...',
    'Analyzing job description...',
    'Comparing against requirements...',
    'Generating feedback...',
  ];
  const priorityWeight = { high: 0, medium: 1, low: 2 };

  const navigate = useNavigate();
  const [completedMilestones, setCompletedMilestones] = useState([]);
  const [skillDomains, setSkillDomains] = useState([]);
  const [userCareerPath, setUserCareerPath] = useState(null); // State for user's path
  const [loading, setLoading] = useState(true);
  const [atsResumeFile, setAtsResumeFile] = useState(null);
  const [jdInputMode, setJdInputMode] = useState('text');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsLoadingMessage, setAtsLoadingMessage] = useState('Reading your resume...');
  const [atsResult, setAtsResult] = useState(null);
  const [atsError, setAtsError] = useState(null);
  const [atsActiveTab, setAtsActiveTab] = useState('strengths');
  const resumeInputRef = useRef(null);
  const jdFileInputRef = useRef(null);
  const loadingTimerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
          navigate('/login');
          return;
        }
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/progress/data', config);
        
        setCompletedMilestones(data.completedMilestones || []);
        setSkillDomains(data.skillDomains || []);
        setUserCareerPath(data.careerPath); // Set the user's career path
      } catch (error) {
        console.error("Failed to fetch progress data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleToggleMilestone = async (milestoneId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.put('http://localhost:5000/api/progress/milestones', { milestoneId }, config);
      setCompletedMilestones(data.completedMilestones);
    } catch (error) {
      console.error('Failed to update milestone', error);
      alert('Could not update milestone. Please try again.');
    }
  };

  const handleResumeFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAtsResumeFile(file);
    setAtsError(null);
  };

  const handleJobDescriptionFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setJobDescriptionFile(file);
    setAtsError(null);
  };

  const handleJdModeChange = (mode) => {
    setJdInputMode(mode);
    setAtsError(null);
  };

  const handleAnalyseResume = async () => {
    const hasJobDescriptionText = jobDescriptionText.trim().length > 0;
    const hasJobDescriptionFile = !!jobDescriptionFile;

    if (!atsResumeFile) {
      setAtsError("The uploaded file doesn't appear to be a resume. Please upload your actual resume PDF.");
      return;
    }

    if (!hasJobDescriptionText && !hasJobDescriptionFile) {
      setAtsError('The job description seems invalid. Please paste or upload a real job posting.');
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.token) {
      navigate('/login');
      return;
    }

    setAtsLoading(true);
    setAtsLoadingMessage(loadingMessages[0]);
    setAtsError(null);
    setAtsResult(null);

    const formData = new FormData();
    formData.append('resume', atsResumeFile);
    formData.append('careerPath', userCareerPath || '');
    if (hasJobDescriptionFile) {
      formData.append('jobDescriptionFile', jobDescriptionFile);
    }
    if (hasJobDescriptionText) {
      formData.append('jobDescriptionText', jobDescriptionText.trim());
    }

    let messageIndex = 0;
    loadingTimerRef.current = setInterval(() => {
      messageIndex = Math.min(messageIndex + 1, loadingMessages.length - 1);
      setAtsLoadingMessage(loadingMessages[messageIndex]);
    }, 1000);

    try {
      const { data } = await axios.post('http://localhost:5000/api/ats/check', formData, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });

      setAtsResult(data);
      setAtsActiveTab('strengths');
    } catch (error) {
      const apiError = error.response?.data;
      if (apiError?.error === 'invalid_resume') {
        setAtsError("The uploaded file doesn't appear to be a resume. Please upload your actual resume PDF.");
      } else if (apiError?.error === 'invalid_jd') {
        setAtsError('The job description seems invalid. Please paste or upload a real job posting.');
      } else {
        setAtsError(apiError?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setAtsLoading(false);
    }
  };

  const resetAtsChecker = () => {
    setAtsResumeFile(null);
    setJdInputMode('text');
    setJobDescriptionText('');
    setJobDescriptionFile(null);
    setAtsLoading(false);
    setAtsLoadingMessage(loadingMessages[0]);
    setAtsResult(null);
    setAtsError(null);
    setAtsActiveTab('strengths');
    if (resumeInputRef.current) {
      resumeInputRef.current.value = '';
    }
    if (jdFileInputRef.current) {
      jdFileInputRef.current.value = '';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#e4b900';
    return 'rgba(196, 167, 161, 1)';
  };

  const listFromValue = (value) => {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
  };

  const normalizeImprovements = (value) => {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (typeof item === 'string') {
          return {
            section: 'General',
            issue: item,
            suggestion: item,
            priority: 'medium',
          };
        }

        return {
          section: item?.section || 'General',
          issue: item?.issue || 'Not specified',
          suggestion: item?.suggestion || 'Not specified',
          priority: ['high', 'medium', 'low'].includes(item?.priority) ? item.priority : 'medium',
        };
      })
      .sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
  };

  const getVerdictClass = (verdict) => {
    if (verdict === 'Strong Match') return 'strong';
    if (verdict === 'Moderate Match') return 'moderate';
    if (verdict === 'Weak Match') return 'weak';
    return 'not-match';
  };

  // Dynamically build the list of milestones to display
  let milestonesToDisplay = [...commonMilestones];
  if (userCareerPath === 'placements') {
    milestonesToDisplay = [...commonMilestones, ...placementsMilestones];
  } else if (userCareerPath === 'higher-studies') {
    milestonesToDisplay = [...commonMilestones, ...higherStudiesMilestones];
  } else if (userCareerPath === 'entrepreneurship') {
    milestonesToDisplay = [...commonMilestones, ...entrepreneurshipMilestones];
  }

  const totalMilestones = milestonesToDisplay.length;
  const overallProgress = totalMilestones > 0 ? (completedMilestones.length / totalMilestones) * 100 : 0;

  const categoryGroups = milestonesToDisplay.reduce((groups, milestone) => {
    const category = milestone.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(milestone);
    return groups;
  }, {});

  const atsScore = typeof atsResult?.score === 'number' ? atsResult.score : 0;
  const atsScoreColor = getScoreColor(atsScore);
  const atsScoreProgress = Math.max(0, Math.min(100, atsScore));
  const scoreRadius = 70;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreOffset = scoreCircumference - (atsScoreProgress / 100) * scoreCircumference;
  const matchedKeywords = listFromValue(atsResult?.matchedKeywords);
  const missingKeywords = listFromValue(atsResult?.missingKeywords);
  const strengths = listFromValue(atsResult?.strengths);
  const mistakes = listFromValue(atsResult?.mistakes);
  const improvements = normalizeImprovements(atsResult?.improvements);
  const canSubmitAts = !!atsResumeFile && (jobDescriptionText.trim().length > 0 || !!jobDescriptionFile);

  if (loading) return <div style={{padding: '2rem'}}>Loading Progress...</div>;

  return (
    <div className="progress-page">
      <div className="progress-header">
        <TrendingUp className="progress-icon" size={24} />
        <h1 className="progress-title">Progress Tracking</h1>
      </div>

      <div className="progress-card overall-progress">
        <div className="progress-card-content">
          <div className="progress-overall-row">
            <div className="progress-overall-left">
              <Trophy className="progress-trophy" size={24} />
              <div>
                <h3 className="progress-overall-title">Overall Progress</h3>
                <p className="progress-overall-desc">{completedMilestones.length} of {totalMilestones} milestones completed</p>
              </div>
            </div>
            <div className="progress-overall-right">
              <span className="progress-overall-percent">{Math.round(overallProgress)}%</span>
            </div>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{width: `${overallProgress}%`}}></div>
          </div>
        </div>
      </div>

      <div className="progress-columns">
        <div className="progress-card milestones">
          <div className="progress-card-header">
            <Target size={20} className="progress-icon" />
            <span className="progress-card-title">Milestones</span>
          </div>
          <div className="progress-card-content">
            {Object.entries(categoryGroups).map(([category, milestones]) => (
              <div key={category} className="progress-category-group">
                <h4 className="progress-category-title">{category}</h4>
                <div className="progress-category-list">
                  {milestones.map(milestone => {
                    const isCompleted = completedMilestones.includes(milestone.id);
                    return (
                      <div key={milestone.id} className={`progress-milestone ${isCompleted ? 'completed' : ''}`} onClick={() => handleToggleMilestone(milestone.id)}>
                        <span className={`progress-checkbox ${isCompleted ? 'checked' : ''}`}>{isCompleted ? <CheckCircle size={16} /> : <span className="progress-checkbox-circle" />}</span>
                        <div className="progress-milestone-info">
                          <span className={`progress-milestone-title ${isCompleted ? 'line-through' : ''}`}>{milestone.title}</span>
                          <span className="progress-milestone-desc">{milestone.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="progress-card skills">
          <div className="progress-card-header">
            <Code size={20} className="progress-icon" />
            <span className="progress-card-title">Skills Development</span>
          </div>
          <div className="progress-card-content">
            {skillDomains.length > 0 ? skillDomains.map(domain => {
              const progressPercentage = domain.target > 0 ? (domain.completed / domain.target) * 100 : 0;
              return (
                <div key={domain.name} className="progress-skill-domain">
                  <div className="progress-skill-row">
                    <span className="progress-skill-title">{domain.name}</span>
                    <span className="progress-skill-badge">{domain.completed}/{domain.target}</span>
                  </div>
                  <div className="progress-bar-bg small">
                    <div className="progress-bar-fill" style={{width: `${progressPercentage}%`}}></div>
                  </div>
                  <div className="progress-skill-info">
                    <span>Progress: {Math.round(progressPercentage)}%</span>
                    <span>{domain.target - domain.completed} courses remaining</span>
                  </div>
                  {progressPercentage === 100 && (
                    <div className="progress-skill-mastered">
                      <CheckCircle size={16} />
                      <span>Domain Mastered!</span>
                    </div>
                  )}
                </div>
              );
            }) : <p>Complete courses in the Resources tab to see your skill progress.</p>}
          </div>
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-card-header">
          <FileText size={20} className="progress-icon" />
          <span className="progress-card-title">ATS Resume Checker</span>
        </div>
        <div className="progress-card-content">
          <p className="progress-overall-desc ats-subtitle">
            Upload your resume and a real job description to get role-specific ATS feedback.
          </p>

          {!atsResult && (
            <div className="ats-panels-grid">
              <div className="ats-panel">
                <div className="ats-panel-title-row">
                  <Briefcase size={18} />
                  <h3>Job Description</h3>
                </div>
                <div className="ats-mode-toggle">
                  <button className={jdInputMode === 'text' ? 'active' : ''} onClick={() => handleJdModeChange('text')} type="button">Paste Text</button>
                  <button className={jdInputMode === 'pdf' ? 'active' : ''} onClick={() => handleJdModeChange('pdf')} type="button">Upload PDF</button>
                </div>

                {jdInputMode === 'text' ? (
                  <>
                    <textarea
                      className="ats-jd-textarea"
                      rows={7}
                      placeholder="Paste the job description here..."
                      value={jobDescriptionText}
                      onChange={(event) => {
                        setJobDescriptionText(event.target.value);
                        setAtsError(null);
                      }}
                    />
                    <p className="ats-char-count">{jobDescriptionText.length} characters</p>
                  </>
                ) : (
                  <>
                    <input
                      ref={jdFileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleJobDescriptionFileChange}
                      style={{ display: 'none' }}
                    />
                    <button className="ats-dropzone" type="button" onClick={() => jdFileInputRef.current?.click()}>
                      <UploadCloud size={20} />
                      <span>{jobDescriptionFile ? jobDescriptionFile.name : 'Click to upload JD PDF'}</span>
                    </button>
                  </>
                )}
              </div>

              <div className="ats-panel">
                <div className="ats-panel-title-row">
                  <FileBadge2 size={18} />
                  <h3>Your Resume</h3>
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeFileChange}
                  style={{ display: 'none' }}
                />
                <button className="ats-dropzone" type="button" onClick={() => resumeInputRef.current?.click()}>
                  <UploadCloud size={20} />
                  <span>{atsResumeFile ? atsResumeFile.name : 'Click to upload Resume PDF'}</span>
                </button>
              </div>
            </div>
          )}

          {!atsResult && (
            <button
              className="ats-primary-btn"
              type="button"
              disabled={!canSubmitAts || atsLoading}
              onClick={handleAnalyseResume}
            >
              {atsLoading ? atsLoadingMessage : 'Analyze My Resume'}
            </button>
          )}

          {atsError && (
            <div className="ats-error-box">
              <AlertTriangle size={16} />
              <span>{atsError}</span>
            </div>
          )}

          {atsResult && (
            <div className="ats-results-wrap">
              <div className="ats-score-card">
                <div className="ats-score-ring-wrap">
                  <svg className="ats-score-ring" viewBox="0 0 180 180" role="img" aria-label="ATS Score">
                    <circle className="ats-score-ring-bg" cx="90" cy="90" r={scoreRadius} />
                    <circle
                      className="ats-score-ring-progress"
                      cx="90"
                      cy="90"
                      r={scoreRadius}
                      style={{
                        stroke: atsScoreColor,
                        strokeDasharray: `${scoreCircumference} ${scoreCircumference}`,
                        strokeDashoffset: scoreOffset,
                      }}
                    />
                  </svg>
                  <div className="ats-score-content">
                    <span className="ats-score-value" style={{ color: atsScoreColor }}>{atsScore}</span>
                    <span className="ats-score-max">/ 100</span>
                    <span className="ats-score-label">ATS Score</span>
                  </div>
                </div>

                <div className="ats-score-meta">
                  <p className="ats-role-line">Analyzed for: <strong>{atsResult?.inferredRole || 'Role Not Inferred'}</strong></p>
                  <span className={`ats-verdict-badge ${getVerdictClass(atsResult?.verdict)}`}>
                    {atsResult?.verdict || 'Moderate Match'}
                  </span>
                  <p className="ats-summary-text">{atsResult?.summary || 'No summary returned.'}</p>
                </div>
              </div>

              <div className="ats-tabs">
                <button className={atsActiveTab === 'strengths' ? 'active' : ''} onClick={() => setAtsActiveTab('strengths')} type="button">💪 Strengths</button>
                <button className={atsActiveTab === 'mistakes' ? 'active' : ''} onClick={() => setAtsActiveTab('mistakes')} type="button">⚠️ Mistakes</button>
                <button className={atsActiveTab === 'keywords' ? 'active' : ''} onClick={() => setAtsActiveTab('keywords')} type="button">🔑 Keywords</button>
                <button className={atsActiveTab === 'action-plan' ? 'active' : ''} onClick={() => setAtsActiveTab('action-plan')} type="button">🎯 Action Plan</button>
              </div>

              <div className="ats-tab-content">
                {atsActiveTab === 'strengths' && (
                  <div className="ats-card-list">
                    {strengths.length > 0 ? strengths.map((item, index) => (
                      <div key={`strength-${index}`} className="ats-list-card strength">
                        <CheckCircle size={16} />
                        <span>{item}</span>
                      </div>
                    )) : <p className="ats-empty-text">No strengths identified.</p>}
                  </div>
                )}

                {atsActiveTab === 'mistakes' && (
                  <div className="ats-card-list">
                    {mistakes.length > 0 ? mistakes.map((item, index) => (
                      <div key={`mistake-${index}`} className="ats-list-card mistake">
                        <AlertTriangle size={16} />
                        <span>{item}</span>
                      </div>
                    )) : <p className="ats-empty-text">No mistakes identified.</p>}
                  </div>
                )}

                {atsActiveTab === 'keywords' && (
                  <div className="ats-keywords-grid">
                    <div className="ats-keywords-column matched">
                      <h4>Matched Keywords ({matchedKeywords.length})</h4>
                      <div className="ats-chips-wrap">
                        {matchedKeywords.length > 0 ? matchedKeywords.map((item, index) => (
                          <span key={`matched-${index}`} className="ats-chip matched">{item}</span>
                        )) : <p className="ats-empty-text">No matched keywords.</p>}
                      </div>
                    </div>
                    <div className="ats-keywords-column missing">
                      <h4>Missing Keywords ({missingKeywords.length})</h4>
                      <div className="ats-chips-wrap">
                        {missingKeywords.length > 0 ? missingKeywords.map((item, index) => (
                          <span key={`missing-${index}`} className="ats-chip missing">{item}</span>
                        )) : <p className="ats-empty-text">No missing keywords.</p>}
                      </div>
                    </div>
                    <p className="ats-keywords-summary">{matchedKeywords.length} matched, {missingKeywords.length} missing</p>
                  </div>
                )}

                {atsActiveTab === 'action-plan' && (
                  <div className="ats-card-list">
                    {improvements.length > 0 ? improvements.map((item, index) => (
                      <div key={`improvement-${index}`} className={`ats-improvement-card ${item.priority}`}>
                        <div className="ats-improvement-header">
                          <span className={`ats-priority-badge ${item.priority}`}>{item.priority}</span>
                          <span className="ats-improvement-section">{item.section}</span>
                        </div>
                        <p className="ats-improvement-issue"><strong>Issue:</strong> {item.issue}</p>
                        <p className="ats-improvement-suggestion"><strong>Suggestion:</strong> {item.suggestion}</p>
                      </div>
                    )) : <p className="ats-empty-text">No action items generated.</p>}
                  </div>
                )}
              </div>

              <button className="ats-secondary-btn" type="button" onClick={resetAtsChecker}>
                <Sparkles size={16} />
                Re-analyze
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}