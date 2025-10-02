// src/pages/Resources.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { BookOpen, ExternalLink, Download, CheckCircle, X, ArrowRight } from "lucide-react";
import './Resources.css';

const resources = [
  // Higher Studies Resources
  {
    id: 1,
    name: "Advanced Data Structures",
    domain: "Computer Science",
    type: "course",
    difficulty: "advanced",
    url: "https://example.com/advanced-ds",
    careerPath: ["higher-studies"],
    websiteLogo: "https://logo.clearbit.com/coursera.com",
    thumbnail: "https://picsum.photos/300/200?random=1",
    instructor: "Dr. Robert Sedgewick",
    totalTime: "40 hours",
    price: "$49"
  },
  {
    id: 2,
    name: "Research Methodology",
    domain: "Academic Skills",
    type: "course",
    difficulty: "intermediate",
    url: "https://example.com/research-methods",
    careerPath: ["higher-studies"],
    websiteLogo: "https://logo.clearbit.com/edx.org",
    thumbnail: "https://picsum.photos/300/200?random=2",
    instructor: "Prof. Sarah Johnson",
    totalTime: "25 hours",
    price: "$39"
  },
  {
    id: 3,
    name: "GATE Computer Science Guide",
    domain: "Competitive Exams",
    type: "book",
    difficulty: "intermediate",
    url: "#",
    careerPath: ["higher-studies"],
    websiteLogo: "https://logo.clearbit.com/amazon.com",
    thumbnail: "https://picsum.photos/300/200?random=3",
    instructor: "Made Easy Publications",
    totalTime: "Self-paced",
    price: "$25"
  },

  // Placements Resources
  {
    id: 4,
    name: "Data Structures and Algorithms Mastery",
    domain: "DSA",
    type: "course",
    difficulty: "intermediate",
    url: "https://example.com/system-design",
    careerPath: ["placements"],
    description: "Complete course covering all essential DSA topics for technical interviews",
    websiteLogo: "https://logo.clearbit.com/udemy.com",
    thumbnail: "https://picsum.photos/300/200?random=4",
    instructor: "Andrei Neagoie",
    totalTime: "35 hours",
    price: "$94.99"
  },
  {
    id: 5,
    name: "System Design Interview Preparation",
    domain: "System Design",
    type: "course",
    difficulty: "intermediate",
    url: "https://leetcode.com",
    careerPath: ["placements"],
    description: "Learn how to design scalable systems for technical interviews",
    websiteLogo: "https://logo.clearbit.com/leetcode.com",
    thumbnail: "https://picsum.photos/300/200?random=5",
    instructor: "Alex Xu",
    totalTime: "30 hours",
    price: "$79.99"
  },
  {
    id: 6,
    name: "Full Stack Web Development",
    domain: "Development",
    type: "course",
    difficulty: "beginner",
    url: "https://example.com/fullstack",
    careerPath: ["placements", "entrepreneurship"],
    description: "Master React, Node.js, and modern web development technologies",
    websiteLogo: "https://logo.clearbit.com/udemy.com",
    thumbnail: "https://picsum.photos/300/200?random=6",
    instructor: "Maximilian Schwarzmüller",
    totalTime: "42 hours",
    price: "$84.99"
  },

  // Entrepreneurship Resources
  {
    id: 7,
    name: "Startup Fundamentals",
    domain: "Business",
    type: "course",
    difficulty: "beginner",
    url: "https://example.com/startup-101",
    careerPath: ["entrepreneurship"],
    websiteLogo: "https://logo.clearbit.com/coursera.com",
    thumbnail: "https://picsum.photos/300/200?random=7",
    instructor: "Steve Blank",
    totalTime: "20 hours",
    price: "$59"
  },
  {
    id: 8,
    name: "Financial Management for Startups",
    domain: "Finance",
    type: "course",
    difficulty: "intermediate",
    url: "https://example.com/startup-finance",
    careerPath: ["entrepreneurship"],
    websiteLogo: "https://logo.clearbit.com/udemy.com",
    thumbnail: "https://picsum.photos/300/200?random=8",
    instructor: "Chris Haroun",
    totalTime: "28 hours",
    price: "$74.99"
  }
];

const downloadableResources = [
  {
    id: 1,
    name: "Data Structures and Algorithms in C++",
    type: "Programming Book",
    format: "PDF",
    size: "8 MB",
    careerPath: ["placements", "higher-studies"],
    description: "Complete reference for DSA implementation"
  },
  {
    id: 2,
    name: "Technical Interview Questions Bank",
    type: "Interview Prep",
    format: "PDF",
    size: "12 MB",
    careerPath: ["placements"],
    description: "Curated collection of technical interview questions"
  },
  {
    id: 3,
    name: "GATE Computer Science Previous Papers",
    type: "GATE Preparation",
    format: "PDF",
    size: "15 MB",
    careerPath: ["higher-studies"]
  },
  {
    id: 4,
    name: "IEEE Research Papers Collection",
    type: "Research Papers",
    format: "ZIP",
    size: "25 MB",
    careerPath: ["higher-studies"]
  },
  {
    id: 5,
    name: "Business Plan Templates",
    type: "Business Resources",
    format: "DOCX",
    size: "5 MB",
    careerPath: ["entrepreneurship"]
  }
];

export default function Resources() {
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(true);
  const [courseIndex, setCourseIndex] = useState(0);
  const [downloadIndex, setDownloadIndex] = useState(0);
  const navigate = useNavigate();
  const coursesPerPage = 3;
  const downloadsPerPage = 2;

  useEffect(() => {
    const fetchUser = async () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        navigate('/login');
        return;
      }
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      try {
        const { data } = await axios.get('http://localhost:5000/api/users/profile', config);
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user data", error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleEnroll = (resourceId, resourceName) => {
    setEnrolledCourses([...enrolledCourses, resourceId]);
    alert(`You've enrolled in "${resourceName}".`);
  };

  const handleComplete = (resourceId, resourceName) => {
    setCompletedCourses([...completedCourses, resourceId]);
    alert(`Congratulations on completing "${resourceName}".`);
  };

  const handleDrop = (resourceId, resourceName) => {
    setEnrolledCourses(enrolledCourses.filter(id => id !== resourceId));
    setCompletedCourses(completedCourses.filter(id => id !== resourceId));
    alert(`You've dropped "${resourceName}".`);
  };

  const handleDownload = (resourceName) => {
    alert(`Downloading "${resourceName}"...`);
  };

  const getFilteredResources = () => {
    if (!user?.careerPath) return resources;
    return resources.filter(resource =>
      resource.careerPath.includes(user.careerPath)
    );
  };

  const getFilteredDownloads = () => {
    if (!user?.careerPath) return downloadableResources;
    return downloadableResources.filter(resource =>
      resource.careerPath.includes(user.careerPath)
    );
  };

  const maxCourseIndex = Math.max(0, getFilteredResources().length - coursesPerPage);
  const maxDownloadIndex = Math.max(0, getFilteredDownloads().length - downloadsPerPage);

  const handlePrev = () => setCourseIndex(Math.max(0, courseIndex - coursesPerPage));
  const handleNext = () => setCourseIndex(Math.min(maxCourseIndex, courseIndex + coursesPerPage));
  const handleDownloadPrev = () => setDownloadIndex(Math.max(0, downloadIndex - downloadsPerPage));
  const handleDownloadNext = () => setDownloadIndex(Math.min(maxDownloadIndex, downloadIndex + downloadsPerPage));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="resources-page">
      {/* Header */}
      <div className="resources-header">
        <BookOpen className="text-vppcoe-primary" size={24} />
        <div>
          <h1>Resources</h1>
          {user?.careerPath && (
            <p>
              Curated for your {user.careerPath.replace('-', ' ')} journey
            </p>
          )}
        </div>
      </div>

      {/* Tabs with slider effect */}
      <div className="resources-tabs">
        <button
          className={activeTab === 'courses' ? 'active' : ''}
          onClick={() => setActiveTab('courses')}
        >
          Online Courses
        </button>
        <button
          className={activeTab === 'downloads' ? 'active' : ''}
          onClick={() => setActiveTab('downloads')}
        >
          Study Materials & Resources
        </button>
      </div>

      {/* Courses Tab with slider */}
      {activeTab === 'courses' && (
        <div className="slider-container">
          <button className="slider-arrow" onClick={handlePrev} disabled={courseIndex === 0}>&lt;</button>
          <div className="resources-grid">
            {getFilteredResources().slice(courseIndex, courseIndex + coursesPerPage).map((resource) => {
              const isEnrolled = enrolledCourses.includes(resource.id);
              const isCompleted = completedCourses.includes(resource.id);
              return (
                <div key={resource.id} className="resource-card">
                  {resource.thumbnail && (
                    <div className="card-image-wrapper">
                      <img src={resource.thumbnail} alt={resource.name} />
                      {resource.websiteLogo && (
                        <div className="card-logo">
                          <img src={resource.websiteLogo} alt="Platform logo" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="card-content">
                    <span className="card-domain">{resource.domain}</span>
                    {resource.price && <span className="price">{resource.price}</span>}
                    <h3>{resource.name}</h3>
                    {resource.instructor && <p className="card-instructor">{resource.instructor}</p>}
                    {resource.totalTime && <p className="card-time">{resource.totalTime}</p>}
                    {resource.description && <p>{resource.description}</p>}
                    <div className="card-actions">
                      {!isEnrolled && !isCompleted && (
                        <button className="card-btn primary" onClick={() => handleEnroll(resource.id, resource.name)}>
                          <ExternalLink size={16} /> Start Now
                        </button>
                      )}
                      {isEnrolled && !isCompleted && (
                        <div className="card-actions">
                          <button className="card-btn" onClick={() => window.open(resource.url, '_blank')}>
                            <ArrowRight size={16} /> Continue Learning
                          </button>
                          <div className="card-btn-group">
                            <button className="card-btn complete" onClick={() => handleComplete(resource.id, resource.name)}>
                              <CheckCircle size={14} /> Complete
                            </button>
                            <button className="card-btn drop" onClick={() => handleDrop(resource.id, resource.name)}>
                              <X size={14} /> Drop
                            </button>
                          </div>
                        </div>
                      )}
                      {isCompleted && (
                        <button className="card-btn revisit" onClick={() => window.open(resource.url, '_blank')}>
                          <ExternalLink size={14} /> Revisit Course
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="slider-arrow" onClick={handleNext} disabled={courseIndex >= maxCourseIndex}>&gt;</button>
        </div>
      )}

      {/* Downloads Tab with slider */}
      {activeTab === 'downloads' && (
        <div className="slider-container">
          <button className="slider-arrow" onClick={handleDownloadPrev} disabled={downloadIndex === 0}>&lt;</button>
          <div className="resources-grid downloads-grid">
            {getFilteredDownloads().slice(downloadIndex, downloadIndex + downloadsPerPage).map((resource) => (
              <div key={resource.id} className="download-card">
                <div>
                  <h3>{resource.name}</h3>
                  <span className="download-type">{resource.type}</span>
                  {resource.description && <p>{resource.description}</p>}
                  <p>Format: {resource.format} | Size: {resource.size}</p>
                </div>
                <button className="download-btn" onClick={() => handleDownload(resource.name)}>
                  <Download size={16} /> Download
                </button>
              </div>
            ))}
          </div>
          <button className="slider-arrow" onClick={handleDownloadNext} disabled={downloadIndex >= maxDownloadIndex}>&gt;</button>
        </div>
      )}
    </div>
  );
}