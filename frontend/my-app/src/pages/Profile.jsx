// src/pages/Profile.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, Save, X, Upload, ExternalLink, Linkedin, Github } from 'lucide-react';
import { toBackendUrl } from '../utils/backendUrl';

const formatDateDdMmYyyy = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB');
};

const TRACK_OPTIONS = [
  { value: 'placements', label: 'Placement' },
  { value: 'higher-studies', label: 'Higher Studies' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
];

const SUBDOMAIN_OPTIONS = {
  placements: ['DSA', 'Aptitude', 'Fullstack', 'ML', 'Frontend', 'Backend', 'DevOps', 'Cybersecurity', 'UX Design', 'Product Management'],
  'higher-studies': ['IELTS', 'GRE', 'GATE', 'MBA', 'MS Computer Science', 'MS Data Science', 'MS Cybersecurity', 'Research & PhD'],
  entrepreneurship: ['Startup Fundamentals', 'Business & Finance', 'Marketing & Growth', 'Product & Design', 'Legal & Operations', 'Fundraising & Pitching'],
};

const formatTrackLabel = (track) => {
  return TRACK_OPTIONS.find((option) => option.value === track)?.label || '-';
};

const normalizeProfileData = (rawData, storedUserInfo = {}) => {
  const next = { ...(rawData || {}) };

  next.careerPath = next.careerPath || next.career_path || storedUserInfo.careerPath || null;
  next.subDomain = next.subDomain || next.subdomain || next.sub_domain || storedUserInfo.subDomain || null;
  next.subDomainReason =
    next.subDomainReason ||
    next.subdomainReason ||
    next.sub_domain_reason ||
    storedUserInfo.subDomainReason ||
    null;

  return next;
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newExperience, setNewExperience] = useState(''); // 1. ADDED: State for new work experience
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const getInitials = (name) => (name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
        const normalizedData = normalizeProfileData(data, userInfo);
        setUser(normalizedData);
        setEditData(normalizedData);
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
      const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({
        ...stored,
        name: data.name,
        careerPath: data.careerPath,
        subDomain: data.subDomain || null,
        subDomainReason: data.subDomainReason || null,
        profileImage: data.profileImage || '',
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile', error);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo?.token) {
      navigate('/login');
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const uploadConfig = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const uploadRes = await axios.post('http://localhost:5000/api/upload/profile', formData, uploadConfig);
      const imagePath = uploadRes.data?.path || '';
      if (!imagePath) return;

      const nextData = { ...editData, profileImage: imagePath };
      setEditData(nextData);

      const profileConfig = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.put('http://localhost:5000/api/users/profile', nextData, profileConfig);
      setUser(data);

      const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({
        ...stored,
        name: data.name,
        careerPath: data.careerPath,
        profileImage: data.profileImage || '',
      }));
    } catch (error) {
      console.error('Failed to upload profile photo', error);
    } finally {
      setUploadingPhoto(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleCancel = () => {
    setEditData(user);
    setIsEditing(false);
  };

  const handleTrackChange = (nextTrack) => {
    setEditData((prev) => ({
      ...prev,
      careerPath: nextTrack || null,
      subDomain: null,
      subDomainReason: null,
    }));
  };

  const handleViewCertificate = async (courseId, fileName) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (!userInfo?.token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/users/courses/certificate/${courseId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error('Failed to open certificate', error);
    }
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
            <div className="avatar-large">
              {currentData.profileImage ? (
                <img src={toBackendUrl(currentData.profileImage)} alt="Profile" className="avatar-image" />
              ) : (
                getInitials(user.name)
              )}
            </div>
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handlePhotoUpload}
                />
                <button
                  className="btn-upload"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  <Upload size={16}/>
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </>
            )}
          </div>
          <div className="details-grid">
            <div className="detail-item"><label>Name</label><p>{user.name}</p></div>
            <div className="detail-item"><label>Email</label><p>{user.email}</p></div>
            <div className="detail-item"><label>Department</label><p>{user.department}</p></div>
            <div className="detail-item"><label>Current Semester</label><p>{user.semester}</p></div>
            <div className="detail-item"><label>Date of Birth</label><p>{formatDateDdMmYyyy(user.dateOfBirth)}</p></div>
            <div className="detail-item">
              <label>Track</label>
              {isEditing ? (
                <select
                  value={editData.careerPath || ''}
                  onChange={(event) => handleTrackChange(event.target.value || null)}
                >
                  <option value="">Select track</option>
                  {TRACK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <p>{formatTrackLabel(currentData.careerPath)}</p>
              )}
            </div>
            <div className="detail-item">
              <label>Domain</label>
              {isEditing ? (
                <select
                  value={editData.subDomain || ''}
                  onChange={(event) => setEditData((prev) => ({ ...prev, subDomain: event.target.value || null }))}
                  disabled={!editData.careerPath}
                >
                  <option value="">Select domain</option>
                  {(SUBDOMAIN_OPTIONS[editData.careerPath] || []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <p>{currentData.subDomain || '-'}</p>
              )}
            </div>
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

      <div className="profile-card">
        <h2>Course Certificates</h2>
        <div className="list-container">
          {currentData.courseCertificates?.length ? (
            currentData.courseCertificates.map((certificate) => (
              <div key={certificate.courseId} className="list-item">
                <span>{certificate.courseTitle || certificate.fileName || 'Course Certificate'}</span>
                <button
                  className="btn-primary"
                  onClick={() => handleViewCertificate(certificate.courseId, certificate.fileName)}
                >
                  View Certificate
                </button>
              </div>
            ))
          ) : (
            <p>No uploaded course certificates yet.</p>
          )}
        </div>
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