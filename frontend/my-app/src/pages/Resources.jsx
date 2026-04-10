// src/pages/Resources.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, User, Download, FileText } from 'lucide-react';
import CareerChatbot from '../components/CareerChatbot';
import '../components/CareerChatbot.css';
import './Resources.css';
import { toBackendUrl } from '../utils/backendUrl';

// Sub-component for interactive Course cards
function CourseCard({ course, userData, onEnroll, onComplete, onDrop }) {
  const isEnrolled = userData.enrolledCourses?.includes(course._id);
  const isCompleted = userData.completedCourses?.includes(course._id);

  return (
    <div className="course-card">
      <img src={course.thumbnailUrl || 'https://via.placeholder.com/400x225'} alt={course.title} className="card-thumbnail" />
      <div className="card-content">
        <span className="domain-tag">{course.domain}</span>
        <h3 className="card-title">{course.title}</h3>
        <div className="card-details">
          <span><User size={14} /> {course.instructor}</span>
          <span><Clock size={14} /> {course.duration}</span>
        </div>
        
        {isCompleted ? (
          <div className="btn-completed">Course Completed ✔</div>
        ) : isEnrolled ? (
          <div className="enrolled-actions">
            <a href={course.url} target="_blank" rel="noopener noreferrer" className="btn-continue">Continue Learning</a>
            <div className="enrolled-buttons">
              <button onClick={() => onComplete(course._id)} className="btn-complete">Mark as Completed</button>
              <button onClick={() => onDrop(course._id)} className="btn-drop">Drop Course</button>
            </div>
          </div>
        ) : (
          <button onClick={() => onEnroll(course._id, course.url)} className="btn-start-now">Start Now</button>
        )}
      </div>
    </div>
  );
}

// Sub-component for simple Material cards
function MaterialCard({ material }) {
  const fullDownloadUrl = toBackendUrl(material.url);

  return (
    <div className="material-card">
      <div className="material-card-header">
        <div className="material-icon-wrapper">
          <FileText size={24} />
        </div>
        <div className="material-title-group">
          <h3>{material.title}</h3>
          <span className="domain-tag">{material.domain}</span>
        </div>
      </div>
      <p className="material-description">{material.description}</p>
      <a href={fullDownloadUrl} target="_blank" rel="noopener noreferrer" className="btn-download">
        <Download size={16} /> Download
      </a>
    </div>
  );
}

const DOMAIN_OPTIONS = {
  placements: ['DSA', 'Aptitude', 'Fullstack', 'ML', 'Frontend', 'Backend', 'DevOps', 'Cybersecurity', 'UX Design', 'Product Management'],
  'higher-studies': ['IELTS', 'GRE', 'GATE', 'MBA', 'MS Computer Science', 'MS Data Science', 'MS Cybersecurity', 'Research & PhD'],
  entrepreneurship: ['Startup Fundamentals', 'Business & Finance', 'Marketing & Growth', 'Product & Design', 'Legal & Operations', 'Fundraising & Pitching'],
};


export default function Resources() {
  const [activeTab, setActiveTab] = useState('courses');
  const [resources, setResources] = useState([]);
  const [userData, setUserData] = useState({ enrolledCourses: [], completedCourses: [] });
  const [domainFilter, setDomainFilter] = useState('all');
  const [careerPath, setCareerPath] = useState(null);
  const [subDomain, setSubDomain] = useState(null);
  const [subDomainReason, setSubDomainReason] = useState(null);
  const [isChangingDomain, setIsChangingDomain] = useState(false);
  const [isRetakingChat, setIsRetakingChat] = useState(false);
  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        navigate('/login');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const profileRes = await axios.get('http://localhost:5000/api/users/profile', config);
      const profileData = profileRes.data;
      const { careerPath, enrolledCourses, completedCourses } = profileData;
      setCareerPath(careerPath || null);
      setUserData({ enrolledCourses, completedCourses });
      setSubDomain(profileData.subDomain || null);
      setSubDomainReason(profileData.subDomainReason || null);

      if (careerPath) {
        const resourcesRes = await axios.get(`http://localhost:5000/api/resources?careerPath=${careerPath}${(profileData.subDomain || null) ? `&domain=${encodeURIComponent(profileData.subDomain)}` : ''}`, config);
        setResources(resourcesRes.data);
      }
    } catch (error) { console.error("Failed to fetch resources", error); }
  };

  useEffect(() => {
    fetchAllData();
  }, [navigate]);

  const handleEnroll = async (courseId, courseUrl) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('http://localhost:5000/api/users/courses/enroll', { courseId }, config);
      window.open(courseUrl, '_blank');
      fetchAllData();
    } catch (error) { 
      console.error("Enrollment failed", error);
      alert("Enrollment failed. Please try again.");
    }
  };

  const handleComplete = async (courseId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('http://localhost:5000/api/users/courses/complete', { courseId }, config);
      fetchAllData();
    } catch (error) { console.error("Failed to mark as complete", error); }
  };

  const handleDrop = async (courseId) => {
    if (window.confirm('Are you sure you want to drop this course?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`http://localhost:5000/api/users/courses/drop/${courseId}`, config);
        fetchAllData();
      } catch (error) { console.error("Failed to drop course", error); }
    }
  };

  async function handleDomainChange(newDomain) {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      await fetch(toBackendUrl('/api/users/subdomain'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subDomain: newDomain, subDomainReason: null }),
      });
      setSubDomain(newDomain);
      setIsChangingDomain(false);
      fetchAllData();
    } catch (err) {
      console.error('Failed to update domain', err);
    }
  }

  async function handleClearDomain() {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      await fetch(toBackendUrl('/api/users/subdomain'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subDomain: null, subDomainReason: null }),
      });
      setSubDomain(null);
      setIsChangingDomain(false);
    } catch (err) {
      console.error('Failed to clear domain', err);
    }
  }
  
  const filteredResources = resources.filter(resource => {
    return domainFilter === 'all' || resource.domain === domainFilter;
  });

  const courses = filteredResources.filter(r => r.type === 'course');
  const materials = filteredResources.filter(r => r.type === 'material');
  const availableDomains = [...new Set(resources.map(r => r.domain))];

  return (
    <div className="resources-container">
      <div className="resources-header">
        <div>
          <h1>Resources</h1>
          <p>Courses and materials tailored to your career path.</p>
        </div>
        {/* --- CORRECTED CONTAINER FOR CONTROLS --- */}
        <div className="resource-controls">
          <div className={`toggle-tabs resource-tabs tab-${activeTab}-active`}>
            <button onClick={() => setActiveTab('courses')} className={activeTab === 'courses' ? 'active' : ''}>Online Courses ({courses.length})</button>
            <button onClick={() => setActiveTab('materials')} className={activeTab === 'materials' ? 'active' : ''}>Study Materials ({materials.length})</button>
          </div>
          
          <div className="domain-filter-container">
            <label htmlFor="domain-filter">Filter by domain</label>
            <select 
              id="domain-filter"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <option value="all">All Domains</option>
              {availableDomains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {careerPath && (!subDomain || isRetakingChat) ? (
        <div style={{ marginBottom: '2rem' }}>
          <div className="resources-header">
            <h1>Find Your Domain</h1>
            <p>Answer a few quick questions and we'll personalise your resources.</p>
          </div>
          <CareerChatbot
            careerPath={careerPath}
            onComplete={(domain, reason) => {
              setSubDomain(domain);
              setSubDomainReason(reason);
              setIsRetakingChat(false);
              fetchAllData();
            }}
          />
          {isRetakingChat && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                className="domain-cancel-btn"
                onClick={() => setIsRetakingChat(false)}
              >
                Cancel — keep current domain ({subDomain})
              </button>
            </div>
          )}
        </div>
      ) : null}

      {careerPath && subDomain && (
        <div className="domain-path-banner">
          {!isChangingDomain ? (
            <>
              <div className="domain-path-info">
                <span className="domain-path-label">Your path</span>
                <span className="domain-path-value">
                  {careerPath}
                  <span className="domain-path-arrow"> {' → '} </span>
                  <strong>{subDomain}</strong>
                </span>
              </div>
              <div className="domain-action-buttons">
                <button
                  className="domain-change-btn"
                  onClick={() => setIsChangingDomain(true)}
                >
                  Change domain
                </button>
                <button
                  className="domain-retake-btn"
                  onClick={() => {
                    setIsRetakingChat(true);
                    setIsChangingDomain(false);
                  }}
                >
                  Retake chat
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="domain-path-info">
                <span className="domain-path-label">Select a new domain</span>
              </div>
              <div className="domain-change-dropdown-row">
                {(DOMAIN_OPTIONS[careerPath] || []).map(domain => (
                  <button
                    key={domain}
                    className={`domain-pill-btn ${domain === subDomain ? 'domain-pill-btn--active' : ''}`}
                    onClick={() => handleDomainChange(domain)}
                  >
                    {domain}
                  </button>
                ))}
                <button
                  className="domain-cancel-btn"
                  onClick={() => setIsChangingDomain(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="resource-grid">
          {courses.map(course => (
            <CourseCard 
              key={course._id}
              course={course}
              userData={userData}
              onEnroll={handleEnroll}
              onComplete={handleComplete}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="material-grid">
          {materials.map(material => (
            <MaterialCard key={material._id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}