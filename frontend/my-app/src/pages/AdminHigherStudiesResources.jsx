import React, { useState } from 'react';
import './AdminHigherStudiesResources.css';

function AdminHigherStudiesResources() {
  const [showModal, setShowModal] = useState(false);
  // ...resource state logic...
  return (
    <div className="admin-higherstudies-resources">
      <h2>Higher Studies Resources</h2>
      <button className="add-btn" onClick={() => setShowModal(true)}>Add Resource</button>
      {/* Resource cards go here */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-form" onClick={e => e.stopPropagation()}>
            <h3>Add Higher Studies Resource</h3>
            <form>
              {/* Form fields */}
              <input type="text" placeholder="Title" />
              <input type="url" placeholder="Resource Link" />
              <button type="submit">Create</button>
            </form>
            <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHigherStudiesResources;
