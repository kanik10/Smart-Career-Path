// src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, Save, X, Upload, ExternalLink, Linkedin, Github } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newExperience, setNewExperience] = useState(''); // 1. ADDED: State for new work experience
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      // ... (this useEffect hook remains the same)
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        navigate('/login');
        return;
      }
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/users/profile', config);
        setUser(data);
        setEditData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    // ... (this function remains the same)
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
      const { data } = await axios.put('http://localhost:5000/api/users/profile', editData, config);
      setUser(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile', error);
    }
  };

  const handleCancel = () => {
    setEditData(user);
    setIsEditing(false);
  };
  
  // --- Skill and Certification helpers remain the same ---
  const addSkill = () => {
    if (newSkill.trim() && !editData.skills.includes(newSkill.trim())) {
      setEditData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };
  const removeSkill = (skillToRemove) => {
    setEditData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
  };
  const addCertification = () => {
    if (newCertification.trim() && !editData.certifications.includes(newCertification.trim())) {
      setEditData(prev => ({...prev, certifications: [...prev.certifications, newCertification.trim()]}));
      setNewCertification('');
    }
  };
  const removeCertification = (certToRemove) => {
    setEditData(prev => ({ ...prev, certifications: prev.certifications.filter(cert => cert !== certToRemove)}));
  };

  // --- 2. ADDED: Helper functions for Work Experience ---
  const addExperience = () => {
    if (newExperience.trim() && !editData.workExperience.includes(newExperience.trim())) {
      setEditData(prev => ({ ...prev, workExperience: [...prev.workExperience, newExperience.trim()] }));
      setNewExperience('');
    }
  };

  const removeExperience = (expToRemove) => {
    setEditData(prev => ({ ...prev, workExperience: prev.workExperience.filter(exp => exp !== expToRemove) }));
  };


  if (loading) {
    return <div>Loading Profile...</div>;
  }

  const currentData = isEditing ? editData : user;

  return (
    <div className="profile-container">
      {/* ... (header, basic details, and skills cards remain the same) ... */}
      <header className="profile-header">
        <h1>Profile</h1>
        <button className="btn-edit-profile" onClick={isEditing ? handleSave : () => setIsEditing(true)}>
          {isEditing ? <Save size={16}/> : <Edit size={16}/>}
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </header>

      {/* --- Basic Details Card --- */}
      <div className="profile-card">
        <h2>Basic Details</h2>
        <div className="details-content">
          <div className="avatar-section">
            <div className="avatar-large">{user.name.split(' ').map(n => n[0]).join('')}</div>
            {isEditing && <button className="btn-upload"><Upload size={16}/> Upload Photo</button>}
          </div>
          <div className="details-grid">
            <div className="detail-item"><label>Name</label><p>{user.name}</p></div>
            <div className="detail-item"><label>Email</label><p>{user.email}</p></div>
            <div className="detail-item"><label>Department</label><p>{user.department}</p></div>
            <div className="detail-item"><label>Current Semester</label><p>{user.semester}</p></div>
            <div className="detail-item"><label>Date of Birth</label><p>{new Date(user.dateOfBirth).toLocaleDateString()}</p></div>
          </div>
        </div>
      </div>
      
      {/* --- Skills Card --- */}
      <div className="profile-card">
        <h2>Skills</h2>
        <div className="tags-container">
          {currentData.skills.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
              {isEditing && <button onClick={() => removeSkill(skill)}><X size={12}/></button>}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="add-item-group">
            <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add new skill..."/>
            <button onClick={addSkill}>Add</button>
          </div>
        )}
      </div>

      {/* --- 3. REPLACED: Work Experience Card --- */}
      <div className="profile-card">
        <h2>Work Experience</h2>
        <div className="list-container">
          {currentData.workExperience?.length > 0 ? (
            currentData.workExperience.map((exp, index) => (
              <div key={index} className="list-item">
                <span>{exp}</span>
                {isEditing && <button onClick={() => removeExperience(exp)} className="btn-remove"><X size={16}/></button>}
              </div>
            ))
          ) : (
            !isEditing && <p>No work experience added yet.</p>
          )}
        </div>
        {isEditing && (
          <div className="add-item-group">
            <input type="text" value={newExperience} onChange={e => setNewExperience(e.target.value)} placeholder="Add new work experience..."/>
            <button onClick={addExperience}>Add</button>
          </div>
        )}
      </div>

       {/* --- Certifications Card --- */}
       <div className="profile-card">
        <h2>Certifications</h2>
        <div className="list-container">
          {currentData.certifications.map((cert, index) => (
            <div key={index} className="list-item">
              <span>{cert}</span>
              {isEditing && <button onClick={() => removeCertification(cert)} className="btn-remove"><X size={16}/></button>}
            </div>
          ))}
        </div>
        {isEditing && (
          <div className="add-item-group">
            <input type="text" value={newCertification} onChange={e => setNewCertification(e.target.value)} placeholder="Add new certification..."/>
            <button onClick={addCertification}>Add</button>
          </div>
        )}
      </div>

      {/* --- Social Links Card (remains the same) --- */}
      <div className="profile-card">
        <h2>Social & Portfolio Links</h2>
        {isEditing ? (
          <div className="links-edit-grid">
            <label>LinkedIn URL</label><input type="text" value={editData.linkedinUrl} onChange={e => setEditData(prev => ({...prev, linkedinUrl: e.target.value}))}/>
            <label>GitHub URL</label><input type="text" value={editData.githubUrl} onChange={e => setEditData(prev => ({...prev, githubUrl: e.target.value}))}/>
            <label>Portfolio URL</label><input type="text" value={editData.portfolioUrl} onChange={e => setEditData(prev => ({...prev, portfolioUrl: e.target.value}))}/>
          </div>
        ) : (
          <div className="social-links-container">
            {currentData.linkedinUrl && <a href={currentData.linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin size={20}/> LinkedIn <ExternalLink size={16}/></a>}
            {currentData.githubUrl && <a href={currentData.githubUrl} target="_blank" rel="noopener noreferrer"><Github size={20}/> GitHub <ExternalLink size={16}/></a>}
            {currentData.portfolioUrl && <a href={currentData.portfolioUrl} target="_blank" rel="noopener noreferrer">Portfolio <ExternalLink size={16}/></a>}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="form-actions">
          <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      )}
    </div>
  );
}