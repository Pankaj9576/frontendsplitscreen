import React, { useState, useEffect } from 'react';
import SplitScreenModal from './components/SplitScreenModal';
// import LoginSignup from './components/LoginSignup';
import './App.css';

function App() {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leftUrl, setLeftUrl] = useState('');
  const [rightUrl, setRightUrl] = useState('');
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  const GOOGLE_SHEET_URL = 'https://www.wipo.int/export/sites/www/sme/en/documents/pdf/ip_panorama_3_learning_points.pdf';
  const PATENT_URL = 'https://patents.google.com/patent/US8900904B2';

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     // Verify token with backend
  //     fetch('https://split-screen-backend.vercel.app/api/verify-token', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`,
  //       },
  //       credentials: 'include',
  //     })
  //       .then(res => {
  //         if (!res.ok) {
  //           throw new Error('Token verification failed');
  //         }
  //         return res.json();
  //       })
  //       .then(data => {
  //         if (data.valid) {
  //           setIsAuthenticated(true);
  //         } else {
  //           localStorage.removeItem('token');
  //           localStorage.removeItem('currentUser');
  //           setIsAuthenticated(false);
  //         }
  //       })
  //       .catch(err => {
  //         console.error('Token verification error:', err);
  //         localStorage.removeItem('token');
  //         localStorage.removeItem('currentUser');
  //         setIsAuthenticated(false);
  //       });
  //   }
  // }, []);

  const openModal = (url = '') => {
    setLeftUrl(url);
    setRightUrl('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setLeftUrl('');
    setRightUrl('');
  };

  // const handleLogin = (user) => {
  //   setIsAuthenticated(true);
  // };

  // const handleLogout = () => {
  //   localStorage.removeItem('currentUser');
  //   localStorage.removeItem('token');
  //   setIsAuthenticated(false);
  // };

  const buttonStyle = {
    padding: '10px 20px',
    margin: '0 10px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontSize: '16px',
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Split Screen Viewer</h1>
        {/* {isAuthenticated && (
          <button style={buttonStyle} onClick={handleLogout}>
            Logout
          </button>
        )} */}
      </header>

      <main className="app-content">
        {/* {isAuthenticated ? ( */}
          <>
            <div className="button-group">
              <button 
                style={buttonStyle}
                onClick={() => openModal(GOOGLE_SHEET_URL)}
              >
                View Google Sheet
              </button>

              <button 
                style={buttonStyle}
                onClick={() => openModal()}
                className="action-button"
              >
                New Split Screen
              </button>

              <button 
                style={buttonStyle}
                onClick={() => openModal(PATENT_URL)}
                className="action-button"
              >
                View Patent
              </button>
            </div>

            {isModalOpen && (
              <SplitScreenModal
                leftSrc={leftUrl}
                rightSrc={rightUrl}
                setLeftSrc={setLeftUrl}
                setRightSrc={setRightUrl}
                onClose={closeModal}
              />
            )}
          </>
        {/* ) : (
          <LoginSignup onLogin={handleLogin} />
        )} */}
      </main>
    </div>
  );
}

export default App;