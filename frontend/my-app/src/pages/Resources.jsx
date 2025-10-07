// src/pages/Resources.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, User, Download } from 'lucide-react';
import './Resources.css';

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
  return (
    <div className="material-card">
      <h3>{material.title}</h3>
      <span className="domain-tag">{material.domain}</span>
      <p>{material.description}</p>
      <a href={material.url} target="_blank" rel="noopener noreferrer" className="btn-download">
        <Download size={16} /> Download
      </a>
    </div>
  );
}


export default function Resources() {
  const [activeTab, setActiveTab] = useState('courses');
  const [resources, setResources] = useState([]);
  const [userData, setUserData] = useState({ enrolledCourses: [], completedCourses: [] });
  const navigate = useNavigate();
   const [domainFilter, setDomainFilter] = useState('all');


  const fetchAllData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        navigate('/login');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const profileRes = await axios.get('http://localhost:5000/api/users/profile', config);
      const { careerPath, enrolledCourses, completedCourses } = profileRes.data;
      setUserData({ enrolledCourses, completedCourses });

      if (careerPath) {
        const resourcesRes = await axios.get(`http://localhost:5000/api/resources?careerPath=${careerPath}`, config);
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

  const filteredResources = resources.filter(resource => {
    return domainFilter === 'all' || resource.domain === domainFilter;
  });

  const courses = filteredResources.filter(r => r.type === 'course');
  const materials = filteredResources.filter(r => r.type === 'material');

  // Dynamically get the list of unique domains from the fetched resources
  const availableDomains = [...new Set(resources.map(r => r.domain))];

 


 return (
    <div className="resources-container">
      <div className="resources-header">
        <h1>Resources</h1>
        <p>Courses and materials tailored to your career path.</p>
      </div>

      {/* --- NEW CONTAINER FOR CONTROLS --- */}
      <div className="resource-controls">
        <div className={`toggle-tabs resource-tabs tab-${activeTab}-active`}>
          <button onClick={() => setActiveTab('courses')} className={activeTab === 'courses' ? 'active' : ''}>Online Courses</button>
          <button onClick={() => setActiveTab('materials')} className={activeTab === 'materials' ? 'active' : ''}>Study Materials & Resources</button>
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