// src/pages/Progress.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Target, Code, CheckCircle, Trophy } from 'lucide-react';
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
  const navigate = useNavigate();
  const [completedMilestones, setCompletedMilestones] = useState([]);
  const [skillDomains, setSkillDomains] = useState([]);
  const [userCareerPath, setUserCareerPath] = useState(null); // State for user's path
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}