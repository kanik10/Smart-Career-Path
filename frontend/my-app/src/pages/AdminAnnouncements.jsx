// src/pages/AdminAnnouncements.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Edit, CheckCircle, Trash2, PlusCircle, X, Calendar, MapPin } from 'lucide-react';
import './AdminAnnouncements.css';

const categoryInfo = {
  placement: { color: 'green' }, drive: { color: 'green' },
  workshop: { color: 'purple' },
  internship: { color: 'red' },
  counselling: { color: 'yellow' },
  'higher study seminar': { color: 'pink' },
  seminar: { color: 'blue' },
  others: { color: 'grey' }
};

const categories = [
  'placement', 'internship', 'workshop', 'drive',
  'counselling', 'higher study seminar', 'seminar', 'others'
];
const initialFormState = { title: '', description: '', category: 'placement', date: '', venue: '', rsvpLink: '' };

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/announcements', config);
      setAnnouncements(data.announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.token || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }
    fetchAnnouncements();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/announcements/${editingId}`, formState, config);
      } else {
        await axios.post('http://localhost:5000/api/announcements', formState, config);
      }
      resetAndCloseForm();
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    }
  };
  
  const handleComplete = async (id) => {
    if (window.confirm('Are you sure you want to mark this as completed?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`http://localhost:5000/api/announcements/${id}/complete`, {}, config);
        fetchAnnouncements();
      } catch (error) { console.error('Error completing announcement:', error); }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this announcement?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`http://localhost:5000/api/announcements/${id}`, config);
        fetchAnnouncements();
      } catch (error) { console.error('Error deleting announcement:', error); }
    }
  };

  const startEdit = (announcement) => {
    setEditingId(announcement._id);
    setFormState({
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      date: new Date(announcement.date).toISOString().slice(0, 16),
      venue: announcement.venue,
      rsvpLink: announcement.rsvpLink || '',
    });
    setIsFormVisible(true);
  };
  
  const resetAndCloseForm = () => {
    setFormState(initialFormState);
    setEditingId(null);
    setIsFormVisible(false);
    setError('');
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesTab = a.status === activeTab;
    if (!matchesTab) return false;
    if (categoryFilter === 'all') return true;
    return a.category === categoryFilter;
  });

  const ongoingCount = announcements.filter(a => a.status === 'ongoing').length;
  const completedCount = announcements.filter(a => a.status === 'completed').length;

  return (
    <div className="admin-announcements-container">
      <div className="admin-announcements-header">
        <div>
          <h1>Announcements Management</h1>
          <p>Create, update, and manage all student-facing announcements.</p>
        </div>
        {!isFormVisible && (
          <button className="btn-add-new" onClick={() => { setEditingId(null); setFormState(initialFormState); setIsFormVisible(true); }}>
            <PlusCircle size={16}/> Add New Announcement
          </button>
        )}
      </div>

      {isFormVisible && (
        <>
          <div className="form-overlay" />
          <div className="form-card">
            <div className="form-header">
              <h2>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h2>
              <button onClick={resetAndCloseForm} className="btn-close-form"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="announcement-form">
              {error && <p className="error-message">{error}</p>}
              <input name="title" value={formState.title} onChange={handleInputChange} placeholder="Title" required />
              <textarea name="description" value={formState.description} onChange={handleInputChange} placeholder="Description" required />
              <div className="form-grid">
                <select name="category" value={formState.category} onChange={handleInputChange} required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                </select>
                <input name="venue" value={formState.venue} onChange={handleInputChange} placeholder="Venue" required />
              </div>
              <div className="form-grid">
                <input name="date" type="datetime-local" value={formState.date} onChange={handleInputChange} required />
                <input name="rsvpLink" value={formState.rsvpLink} onChange={handleInputChange} placeholder="RSVP Link (Optional)" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetAndCloseForm}>Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Create Announcement'}</button>
              </div>
            </form>
          </div>
        </>
      )}

      <div className="admin-controls-bar">
        <div className="toggle-tabs admin-tabs">
          <button onClick={() => setActiveTab('ongoing')} className={activeTab === 'ongoing' ? 'active' : ''}>Ongoing ({ongoingCount})</button>
          <button onClick={() => setActiveTab('completed')} className={activeTab === 'completed' ? 'active' : ''}>Completed ({completedCount})</button>
        </div>
        <div className="category-filter">
          <label htmlFor="category-select">Filter by category:</label>
          <select id="category-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
          </select>
        </div>
      </div>
      
      <div className="announcements-list admin-view">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement._id} className="announcement-card admin-card">
            <div className="admin-card-header">
              <div>
                <h3>{announcement.title}</h3>
                <span className={`tag ${categoryInfo[announcement.category]?.color || 'grey'}`}>{announcement.category}</span>
              </div>
              <div className="admin-card-actions">
                {activeTab === 'ongoing' && (
                  <>
                    <button onClick={() => startEdit(announcement)}><Edit size={16}/> Edit</button>
                    <button onClick={() => handleComplete(announcement._id)}><CheckCircle size={16}/> Complete</button>
                  </>
                )}
                <button onClick={() => handleDelete(announcement._id)} className="btn-delete"><Trash2 size={16}/> Delete</button>
              </div>
            </div>
            <p>{announcement.description}</p>
            <div className="admin-card-details">
              <span className="detail-item"><Calendar size={14}/> {new Date(announcement.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
              <span className="detail-item"><MapPin size={14}/> {announcement.venue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}