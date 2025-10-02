import { useState } from 'react';
import { TrendingUp, Target, Code, CheckCircle, Trophy } from 'lucide-react';
import './Progress.css';

const milestonesData = [
  { id: 1, title: "Complete Profile Setup", description: "Add all required information to your profile", completed: true, category: "Profile" },
  { id: 2, title: "Attend Mock Interview", description: "Participate in a practice interview session", completed: true, category: "Interview Prep" },
  { id: 3, title: "Upload Resume", description: "Upload your latest resume to the portal", completed: true, category: "Documents" },
  { id: 4, title: "Complete 5 Coding Challenges", description: "Solve algorithmic problems to improve coding skills", completed: false, category: "Technical Skills" },
  { id: 5, title: "Attend Technical Workshop", description: "Participate in any technical workshop or seminar", completed: false, category: "Learning" },
  { id: 6, title: "Network with Alumni", description: "Connect with at least 3 VPPCOE alumni", completed: false, category: "Networking" },
  { id: 7, title: "Complete Internship Application", description: "Apply for at least one internship opportunity", completed: false, category: "Career" },
  { id: 8, title: "Join Study Group", description: "Collaborate with peers in a study group", completed: false, category: "Collaboration" }
];

const skillDomainsData = [
  { id: 1, name: "Data Structures & Algorithms", completed: 7, target: 10 },
  { id: 2, name: "Web Development", completed: 5, target: 8 },
  { id: 3, name: "Database Management", completed: 3, target: 6 },
  { id: 4, name: "System Design", completed: 2, target: 5 },
  { id: 5, name: "Machine Learning", completed: 1, target: 4 },
  { id: 6, name: "Mobile Development", completed: 2, target: 6 }
];

export default function Progress() {
  const [milestones, setMilestones] = useState(milestonesData);
  const completedMilestones = milestones.filter(m => m.completed).length;
  const totalMilestones = milestones.length;
  const overallProgress = (completedMilestones / totalMilestones) * 100;

  const categoryGroups = milestones.reduce((groups, milestone) => {
    const category = milestone.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(milestone);
    return groups;
  }, {});

  return (
    <div className="progress-page">
      {/* Header */}
      <div className="progress-header">
        <TrendingUp className="progress-icon" size={24} />
        <h1 className="progress-title">Progress Tracking</h1>
      </div>

      {/* Overall Progress */}
      <div className="progress-card overall-progress">
        <div className="progress-card-content">
          <div className="progress-overall-row">
            <div className="progress-overall-left">
              <Trophy className="progress-trophy" size={24} />
              <div>
                <h3 className="progress-overall-title">Overall Progress</h3>
                <p className="progress-overall-desc">{completedMilestones} of {totalMilestones} milestones completed</p>
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

      {/* Two Column Layout */}
      <div className="progress-columns">
        {/* Milestones */}
        <div className="progress-card milestones">
          <div className="progress-card-header">
            <Target size={20} className="progress-icon" />
            <span className="progress-card-title">Milestones</span>
          </div>
          <div className="progress-card-content">
            {Object.entries(categoryGroups).map(([category, categoryMilestones]) => (
              <div key={category} className="progress-category-group">
                <h4 className="progress-category-title">{category}</h4>
                <div className="progress-category-list">
                  {categoryMilestones.map(milestone => (
                    <div key={milestone.id} className={`progress-milestone ${milestone.completed ? 'completed' : ''}`}>
                      <span className={`progress-checkbox ${milestone.completed ? 'checked' : ''}`}>{milestone.completed ? <CheckCircle size={16} /> : <span className="progress-checkbox-circle" />}</span>
                      <div className="progress-milestone-info">
                        <span className={`progress-milestone-title ${milestone.completed ? 'line-through' : ''}`}>{milestone.title}</span>
                        <span className="progress-milestone-desc">{milestone.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Development */}
        <div className="progress-card skills">
          <div className="progress-card-header">
            <Code size={20} className="progress-icon" />
            <span className="progress-card-title">Skills Development</span>
          </div>
          <div className="progress-card-content">
            {skillDomainsData.map(domain => {
              const progressPercentage = (domain.completed / domain.target) * 100;
              return (
                <div key={domain.id} className="progress-skill-domain">
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
            })}
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="progress-card achievements">
        <div className="progress-card-header">
          <Trophy size={20} className="progress-icon" />
          <span className="progress-card-title">Achievements Unlocked</span>
        </div>
        <div className="progress-achievements-grid">
          <div className="progress-achievement green">
            <CheckCircle className="progress-achievement-icon green" size={24} />
            <span className="progress-achievement-title">Profile Complete</span>
            <span className="progress-achievement-desc">First milestone achieved</span>
          </div>
          <div className="progress-achievement blue">
            <Target className="progress-achievement-icon blue" size={24} />
            <span className="progress-achievement-title">Interview Ready</span>
            <span className="progress-achievement-desc">Mock interview completed</span>
          </div>
          <div className="progress-achievement purple">
            <Code className="progress-achievement-icon purple" size={24} />
            <span className="progress-achievement-title">DSA Progress</span>
            <span className="progress-achievement-desc">70% completion in DSA</span>
          </div>
          <div className="progress-achievement gray">
            <Trophy className="progress-achievement-icon gray" size={24} />
            <span className="progress-achievement-title">Course Master</span>
            <span className="progress-achievement-desc">Complete 10 courses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
