import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [counts, setCounts] = useState({
    event: 0,
    placement: 0,
    workshop: 0,
    internship: 0,
  });

  const fetchAnnouncements = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/announcements', config);
      setAnnouncements(data.announcements.filter(a => a.status === 'ongoing'));
      setCounts(data.counts);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="announcements-container">
      <h1 className="page-title">Announcements</h1>

      {/* Category Stats */}
      <div className="category-stats">
        <div className="stat-card">
          <h3>{counts.event}</h3>
          <p>Upcoming Events</p>
        </div>
        <div className="stat-card">
          <h3>{counts.placement}</h3>
          <p>Placement Drives</p>
        </div>
        <div className="stat-card">
          <h3>{counts.workshop}</h3>
          <p>Workshops</p>
        </div>
        <div className="stat-card">
          <h3>{counts.internship}</h3>
          <p>Internships</p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="announcements-list">
        {announcements.map((announcement) => (
          <div key={announcement._id} className="announcement-card">
            <div className="card-header">
              <h3>{announcement.title}</h3>
              <span className={`tag ${announcement.category}`}>
                {announcement.category}
              </span>
            </div>
            <p className="description">{announcement.description}</p>
            <div className="announcement-details">
              <div className="detail">
                <span className="icon">📅</span>
                {new Date(announcement.date).toLocaleString()}
              </div>
              <div className="detail">
                <span className="icon">📍</span>
                {announcement.venue}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}