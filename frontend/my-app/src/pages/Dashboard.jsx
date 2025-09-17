// src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Plus, Trash2, CheckCircle, Circle, User, BookOpen, Award, ListChecks, Lightbulb } from "lucide-react";

// --- Restored Mock Data for Courses and Achievements ---
const mockCourses = [
  { id: 1, name: "Advanced JavaScript", domain: "Web Development" },
  { id: 2, name: "Data Structures & Algorithms", domain: "Computer Science" },
  { id: 3, name: "Machine Learning Basics", domain: "AI/ML" },
];

const mockAchievements = [
  "Mock drive attended",
  "Profile completed",
  "Resume uploaded"
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
        const [profileResponse, todosResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/users/profile', config),
          axios.get('http://localhost:5000/api/todos', config)
        ]);
        setUser(profileResponse.data);
        setTodos(todosResponse.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        localStorage.removeItem('userInfo');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
      const { data: createdTodo } = await axios.post('http://localhost:5000/api/todos', { text: newTodo }, config);
      setTodos([...todos, createdTodo]);
      setNewTodo("");
    } catch (error) {
      console.error("Failed to add todo", error);
    }
  };

  const toggleTodo = async (id) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
      const { data: updatedTodo } = await axios.put(`http://localhost:5000/api/todos/${id}`, {}, config);
      setTodos(todos.map(todo => (todo._id === id ? updatedTodo : todo)));
    } catch (error) {
      console.error("Failed to update todo", error);
    }
  };

  const deleteTodo = async (id) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`, config);
      setTodos(todos.filter(todo => todo._id !== id));
    } catch (error) {
      console.error("Failed to delete todo", error);
    }
  };

  const getInitials = (name = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return <div>Loading Dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-banner">
        <h2>Welcome back, {user?.name}!</h2>
        <p>Ready to continue your journey?</p>
      </div>

      <div className="stats-grid">
        <div className="profile-card">
          <div className="avatar">
            {user?.profilePicture ? <img src={user.profilePicture} alt="Profile" /> : <User size={32} />}
          </div>
          <h3>{user?.name}</h3>
          <p>{user?.department}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper"><BookOpen size={32} color="#7A698B" /></div>
          <h4>5</h4><p>Courses Enrolled</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper"><CheckCircle size={32} color="#28a745" /></div>
          <h4>3</h4><p>Courses Completed</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper"><Award size={32} color="#FBC02D" /></div>
          <h4>2</h4><p>Certificates</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="card">
          <h3 className="card-title"><ListChecks size={20} /> Weekly To-Do List</h3>
          <div className="todo-input-group">
            <input
              type="text" placeholder="Add a new task..." value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            />
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

        {/* --- Restored JSX for Current Focus using mockCourses --- */}
        <div className="card">
          <h3 className="card-title">
            <Lightbulb size={20} />
            Current Focus
          </h3>
          <div className="focus-list">
            {mockCourses.map(course => (
              <div key={course.id} className="focus-item">
                <h4>{course.name}</h4>
                <span className="domain-badge">{course.domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Restored JSX for Recent Achievements using mockAchievements --- */}
      <div className="card">
        <h3 className="card-title">Recent Achievements</h3>
        <div className="achievements-grid">
          {mockAchievements.map((ach, index) => (
            <div key={index} className="achievement-item">
              {ach}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}