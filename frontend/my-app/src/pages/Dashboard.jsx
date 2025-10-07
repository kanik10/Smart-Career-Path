// src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Plus, Trash2, CheckCircle, Circle, User, BookOpen, Award, ListChecks, Lightbulb } from "lucide-react";
import './Dashboard.css';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.token) {
      navigate('/login');
      return;
    }
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    };
    try {
      // Fetch all dashboard data in one single call
      const { data } = await axios.get('http://localhost:5000/api/dashboard/data', config);
      setDashboardData(data);
      setTodos(data.todos || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      localStorage.removeItem('userInfo');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: createdTodo } = await axios.post('http://localhost:5000/api/todos', { text: newTodo }, config);
      setTodos([createdTodo, ...todos]); // Add to the top of the list
      setNewTodo("");
    } catch (error) {
      console.error("Failed to add todo", error);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data: updatedTodo } = await axios.put(`http://localhost:5000/api/todos/${id}`, {}, config);
      setTodos(todos.map(todo => (todo._id === id ? updatedTodo : todo)));
    } catch (error) {
      console.error("Failed to update todo", error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`http://localhost:5000/api/todos/${id}`, config);
      setTodos(todos.filter(todo => todo._id !== id));
    } catch (error) {
      console.error("Failed to delete todo", error);
    }
  };

  if (loading || !dashboardData) {
    return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;
  }

  // Destructure the data from our single API call
  const { userProfile, stats, currentFocus, recentAchievements } = dashboardData;

  return (
    <div className="dashboard-container">
      <div className="welcome-banner">
        <h2>Welcome back, {userProfile.name}!</h2>
        <p>Ready to continue your journey?</p>
      </div>

      <div className="stats-grid">
        <div className="profile-card">
          <div className="avatar">
            {userProfile.profilePicture ? <img src={userProfile.profilePicture} alt="Profile" /> : <User size={32} />}
          </div>
          <h3>{userProfile.name}</h3>
          <p>{userProfile.department}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper"><BookOpen size={32} color="#7A698B" /></div>
          <h4>{stats.coursesEnrolled}</h4><p>Courses Enrolled</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper"><CheckCircle size={32} color="#28a745" /></div>
          <h4>{stats.coursesCompleted}</h4><p>Courses Completed</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper"><Award size={32} color="#FBC02D" /></div>
          <h4>{stats.certificates}</h4><p>Certificates</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="card">
          <h3 className="card-title"><ListChecks size={20} /> Weekly To-Do List</h3>
          <div className="todo-input-group">
            <input type="text" placeholder="Add a new task..." value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()} />
            <button onClick={addTodo}><Plus size={18} /></button>
          </div>
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo._id} className={todo.completed ? 'completed' : ''}>
                <button onClick={() => toggleTodo(todo._id)} className="todo-check">
                  {todo.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
                <span>{todo.text}</span>
                <button onClick={() => deleteTodo(todo._id)} className="todo-delete"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="card-title"><Lightbulb size={20} /> Current Focus</h3>
          <div className="focus-list">
            {currentFocus.map(course => (
              <div key={course._id} className="focus-item">
                <h4>{course.title}</h4> {/* Use .title from Resource model */}
                <span className="domain-badge">{course.domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Recent Achievements</h3>
        <div className="achievements-grid">
          {recentAchievements.map((ach, index) => (
            <div key={index} className="achievement-item">
              {ach}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}