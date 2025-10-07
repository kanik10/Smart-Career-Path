// src/pages/AdminResourceCategoryPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Trash2, X, File } from 'lucide-react';
import './AdminResources.css';

const initialFormState = { title: '', description: '', domain: '', url: '', instructor: '', duration: '', thumbnailUrl: '' };

export default function AdminResourceCategoryPage() {
  const { careerPath } = useParams();
  const navigate = useNavigate();
  
  const [resources, setResources] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState('course');
  const [formState, setFormState] = useState(initialFormState);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('all');

  const fetchResources = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        navigate('/login');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`http://localhost:5000/api/resources?careerPath=${careerPath}`, config);
      setResources(data);
    } catch (error) {
      console.error(`Failed to fetch resources for ${careerPath}`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [careerPath, navigate]);

  const openModal = (type) => {
    setResourceType(type);
    setFormState(initialFormState);
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setFormState(initialFormState);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    setError('');
    
    let resourceUrl = formState.url;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      let config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      let newResourceData = {};

      if (resourceType === 'material') {
        if (!file) {
          setError('Please select a file to upload.');
          return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadConfig = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.post('http://localhost:5000/api/upload', formData, uploadConfig);
        resourceUrl = data.path;
        setUploading(false);
        
        newResourceData = {
          title: formState.title,
          domain: formState.domain,
          url: resourceUrl,
          description: formState.description || 'Downloadable study material.',
          type: 'material',
          careerPath: careerPath,
        };

      } else { // It's a 'course'
        newResourceData = {
          ...formState,
          type: 'course',
          careerPath: careerPath,
        };
      }
      
      await axios.post('http://localhost:5000/api/resources', newResourceData, config);
      
      fetchResources();
      closeModal();
    } catch (err) {
      setUploading(false); // Ensure loading state is reset on error
      setError(err.response?.data?.message || 'Failed to create resource.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource permanently?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`http://localhost:5000/api/resources/${id}`, config);
        fetchResources();
      } catch (error) {
        console.error('Failed to delete resource', error);
        alert('Failed to delete resource.');
      }
    }
  };

  const title = careerPath.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const availableDomains = [...new Set(resources.map(r => r.domain))];
  const filteredResources = resources.filter(resource => domainFilter === 'all' || resource.domain === domainFilter);

  return (
    <div className="admin-resources-container">
      <div className="admin-announcements-header">
        <div>
          <h1>Manage {title} Resources</h1>
          <p>Add, filter, and delete resources for the '{title}' path.</p>
        </div>
      </div>

      <div className="admin-controls-bar">
        <div className="header-actions">
          <button className="btn-add-new" onClick={() => openModal('course')}>
            <PlusCircle size={16} /> Add New Course
          </button>
          <button className="btn-add-new secondary" onClick={() => openModal('material')}>
            <PlusCircle size={16} /> Add Study Material
          </button>
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New {resourceType === 'course' ? 'Course' : 'Study Material'}</h2>
              <button onClick={closeModal} className="btn-close-modal"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateResource} className="modal-form">
              {error && <p className="error-message">{error}</p>}
              <input name="title" value={formState.title} onChange={handleInputChange} placeholder="Title" required />
              <input name="domain" value={formState.domain} onChange={handleInputChange} placeholder="Domain (e.g., Computer Science)" required />
              
              {resourceType === 'course' ? (
                <>
                  <textarea name="description" value={formState.description} onChange={handleInputChange} placeholder="Description" required />
                  <div className="form-grid">
                    <input name="instructor" value={formState.instructor} onChange={handleInputChange} placeholder="Educator Name" />
                    <input name="duration" value={formState.duration} onChange={handleInputChange} placeholder="Duration (e.g., 40 hours)" />
                  </div>
                  <input name="thumbnailUrl" value={formState.thumbnailUrl} onChange={handleInputChange} placeholder="Thumbnail Image URL (Optional)" />
                  <input name="url" value={formState.url} onChange={handleInputChange} placeholder="Course URL / Link" required />
                </>
              ) : (
                <>
                  <textarea name="description" value={formState.description} onChange={handleInputChange} placeholder="Short Description" required />
                  <div className="file-input-container">
                    <label htmlFor="file-upload">Upload File (PDF, Notes, etc.)</label>
                    <input id="file-upload" type="file" onChange={(e) => setFile(e.target.files[0])} required />
                  </div>
                </>
              )}
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="admin-resource-list">
        {loading ? <p>Loading resources...</p> : filteredResources.map(resource => (
          <div key={resource._id} className="admin-resource-card">
            {resource.thumbnailUrl ? (
              <img src={resource.thumbnailUrl} alt={resource.title} className="resource-card-thumbnail" />
            ) : (
              <div className="resource-card-icon-placeholder">
                <File size={32} />
              </div>
            )}
            <div className="resource-card-info">
              <h3>{resource.title}</h3>
              <p className="resource-domain-tag">{resource.domain}</p>
              <div className="resource-card-body">
                {resource.instructor && <p><strong>Educator:</strong> {resource.instructor}</p>}
                {resource.duration && <p><strong>Duration:</strong> {resource.duration}</p>}
              </div>
            </div>
            <div className="resource-card-actions">
              <button className="btn-delete" onClick={() => handleDelete(resource._id)}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        ))}
        {!loading && filteredResources.length === 0 && <p>No resources found for this filter.</p>}
      </div>
    </div>
  );
}