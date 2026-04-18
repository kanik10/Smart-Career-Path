import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import axios from 'axios';
import './AdminStudentProgress.css';

const careerPathLabel = (value) => {
  if (!value) return 'Not chosen';
  return value.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const toCsvValue = (value) => {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const normalizeStudents = (payload) => {
  const source = Array.isArray(payload?.students)
    ? payload.students
    : Array.isArray(payload?.users)
      ? payload.users
      : [];

  return source
    .map((student) => {
      const enrolledCourses = Array.isArray(student.enrolledCourses)
        ? student.enrolledCourses
            .map((course) => {
              if (typeof course === 'string') return course;
              if (course && typeof course.title === 'string') return course.title;
              return '';
            })
            .filter(Boolean)
        : [];

      const completedCourses = Array.isArray(student.completedCourses)
        ? student.completedCourses
            .map((course) => {
              if (typeof course === 'string') return course;
              if (course && typeof course.title === 'string') return course.title;
              return '';
            })
            .filter(Boolean)
        : [];

      const enrolledCoursesCount = Number.isFinite(student.enrolledCoursesCount)
        ? student.enrolledCoursesCount
        : enrolledCourses.length;

      const completedCoursesCount = Number.isFinite(student.completedCoursesCount)
        ? student.completedCoursesCount
        : completedCourses.length;

      return {
        _id: student._id,
        name: student.name || 'Unknown',
        department: student.department || 'Unknown',
        semester: student.semester || 'Unknown',
        careerPath: student.careerPath || null,
        enrolledCourses,
        completedCourses,
        enrolledCoursesCount,
        completedCoursesCount,
      };
    })
    .sort((a, b) => {
      if (b.completedCoursesCount !== a.completedCoursesCount) {
        return b.completedCoursesCount - a.completedCoursesCount;
      }
      return a.name.localeCompare(b.name);
    });
};

const deriveFilterOptions = (students, apiFilters) => {
  const derived = {
    departments: Array.from(new Set(students.map((s) => s.department).filter(Boolean))).sort(),
    semesters: Array.from(new Set(students.map((s) => s.semester).filter(Boolean))).sort(),
    careerPaths: Array.from(new Set(students.map((s) => s.careerPath).filter(Boolean))).sort(),
  };

  const fromApi = {
    departments: Array.isArray(apiFilters?.departments) ? apiFilters.departments.filter(Boolean) : [],
    semesters: Array.isArray(apiFilters?.semesters) ? apiFilters.semesters.filter(Boolean) : [],
    careerPaths: Array.isArray(apiFilters?.careerPaths) ? apiFilters.careerPaths.filter(Boolean) : [],
  };

  return {
    departments: (fromApi.departments.length ? fromApi.departments : derived.departments).sort(),
    semesters: (fromApi.semesters.length ? fromApi.semesters : derived.semesters).sort(),
    careerPaths: (fromApi.careerPaths.length ? fromApi.careerPaths : derived.careerPaths).sort(),
  };
};

export default function AdminStudentProgress() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ departments: [], semesters: [], careerPaths: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedCareerPath, setSelectedCareerPath] = useState('All Career Paths');

  useEffect(() => {
    const fetchStudentProgress = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token || !userInfo.isAdmin) {
          navigate('/admin');
          return;
        }

        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/admin/users?view=student-progress', config);

        const normalizedStudents = normalizeStudents(data);
        const options = deriveFilterOptions(normalizedStudents, data.filters);

        setStudents(normalizedStudents);
        setFilterOptions(options);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to fetch student progress list');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, [navigate]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'All Departments' || student.department === selectedDepartment;
      const matchesSemester = selectedSemester === 'All Semesters' || student.semester === selectedSemester;
      const matchesCareerPath =
        selectedCareerPath === 'All Career Paths' ||
        (selectedCareerPath === 'Not chosen' ? !student.careerPath : student.careerPath === selectedCareerPath);

      return matchesSearch && matchesDepartment && matchesSemester && matchesCareerPath;
    });
  }, [students, searchQuery, selectedDepartment, selectedSemester, selectedCareerPath]);

  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Department',
      'Semester',
      'Career Path',
      'Enrolled Courses',
      'Completed Courses',
      'Enrolled Courses Count',
      'Completed Courses Count',
    ];

    const rows = filteredStudents.map((student) => [
      student.name,
      student.department,
      student.semester,
      careerPathLabel(student.careerPath),
      (student.enrolledCourses || []).join(' | '),
      (student.completedCourses || []).join(' | '),
      student.enrolledCoursesCount,
      student.completedCoursesCount,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => toCsvValue(cell)).join(','))
      .join('\n');

    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);

    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = `student-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(csvUrl);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading student progress...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div className="student-progress-page">
      <header className="page-header student-progress-header">
        <div>
          <h1>Student Progress</h1>
          <p>Track course completion and enrollment across all students.</p>
        </div>
        <button type="button" className="export-csv-btn" onClick={handleExportCsv}>
          <Download size={16} />
          Export CSV
        </button>
      </header>

      <section className="filters-section">
        <div className="search-filter">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
            <option>All Departments</option>
            {filterOptions.departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
            <option>All Semesters</option>
            {filterOptions.semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>

          <select value={selectedCareerPath} onChange={(event) => setSelectedCareerPath(event.target.value)}>
            <option>All Career Paths</option>
            <option value="Not chosen">Not chosen</option>
            {filterOptions.careerPaths.map((path) => (
              <option key={path} value={path}>
                {careerPathLabel(path)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="users-table student-progress-table-wrap">
        <table className="student-progress-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Career Path</th>
              <th>Enrolled Courses</th>
              <th>Completed Courses</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td>{student.name}</td>
                <td>{student.department}</td>
                <td>{student.semester}</td>
                <td>{careerPathLabel(student.careerPath)}</td>
                <td className="courses-cell">
                  <span className="courses-count">{student.enrolledCoursesCount}</span>
                </td>
                <td className="courses-cell">
                  <span className="courses-count completed">{student.completedCoursesCount}</span>
                </td>
              </tr>
            ))}
            {!filteredStudents.length && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No students match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
