// src/pages/Announcements.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin } from 'lucide-react';
import './Announcements.css';

// This helper object remains the same
const categoryDisplayInfo = {
  upcoming: { label: 'Upcoming Events', color: 'blue', filter: 'all' },
  placement: { label: 'Placements', color: 'green', filter: ['placement', 'drive'] },
  internship: { label: 'Internships', color: 'red', filter: ['internship'] },
  workshop: { label: 'Workshops', color: 'purple', filter: ['workshop'] },
  counselling: { label: 'Counselling', color: 'yellow', filter: ['counselling'] },
  seminar: { label: 'Seminars', color: 'blue', filter: ['seminar', 'higher study seminar'] },
  'higher study seminar': { label: 'Higher Studies', color: 'pink', filter: ['higher study seminar'] },
  others: { label: 'Others', color: 'grey', filter: ['others'] }
};

export default function Announcements() {
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [counts, setCounts] = useState({});
  const [activeTab, setActiveTab] = useState('upcoming');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/announcements', config);
        setAllAnnouncements(data.announcements);
        setCounts(data.counts);
      } catch (error) { console.error('Error fetching announcements:', error); }
    };
    fetchAnnouncements();
  }, []);

  // --- THIS IS THE CORRECTED FILTERING LOGIC ---
  const filteredAnnouncements = allAnnouncements.filter(announcement => {
    // 1. Use the 'isPast' flag from the backend
    const matchesTab = activeTab === 'past' ? announcement.isPast : !announcement.isPast;

    if (!matchesTab) return false;

    // 2. The category filter remains the same
    if (categoryFilter === 'all') return true;
    return categoryFilter.includes(announcement.category);
  });

  const statCardOrder = ['upcoming', 'placement', 'internship', 'workshop', 'counselling', 'seminar', 'higher study seminar', 'others'];

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h1>Announcements</h1>
      </div>

      <div className="announcement-stats-grid-scrollable">
        {statCardOrder.map(key => {
          const info = categoryDisplayInfo[key];
          if (!info) return null;
          let displayCount = 0;
          if (key === 'upcoming') {
            displayCount = counts.upcoming || 0;
          } else {
            info.filter.forEach(cat => { displayCount += (counts[cat] || 0); });
          }
          return (
            <button
              className={`stat-item ${info.color} ${JSON.stringify(categoryFilter) === JSON.stringify(info.filter) ? 'active' : ''}`}
              key={key}
              onClick={() => setCategoryFilter(info.filter)}
            >
              <h3>{displayCount}</h3>
              <p>{info.label}</p>
            </button>
          );
        })}
      </div>

     <div className={`toggle-tabs student-tabs tab-${activeTab}-active`}>
        <button onClick={() => setActiveTab('upcoming')} className={activeTab === 'upcoming' ? 'active' : ''}>Upcoming Events</button>
        <button onClick={() => setActiveTab('past')} className={activeTab === 'past' ? 'active' : ''}>Past Events</button>
      </div>

      <div className="announcements-list student-view">
        {filteredAnnouncements.map((announcement) => {
          const infoColor = categoryDisplayInfo[announcement.category]?.color || 'grey';
          return (
            <div key={announcement._id} className={`announcement-card student-card border-${infoColor}`}>
              <h3>{announcement.title} <span className={`tag ${infoColor}`}>{announcement.category}</span></h3>
              <p>{announcement.description}</p>
              <div className="details-footer">
                <div className="details-left">
                  <span className="detail-item"><Calendar size={14}/> {new Date(announcement.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                  <span className="detail-item"><MapPin size={14}/> {announcement.venue}</span>
                  <span className={`detail-item ${announcement.isPast ? 'past' : 'upcoming'}`}>{announcement.isPast ? 'Past' : 'Upcoming'}</span>
                </div>
                <div className="details-right">
                  {!announcement.isPast && announcement.rsvpLink && (
                    <a href={announcement.rsvpLink} target="_blank" rel="noopener noreferrer" className="rsvp-button">RSVP Here</a>
                  )}
                  {announcement.isPast && <span className="event-completed">Event Completed</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}