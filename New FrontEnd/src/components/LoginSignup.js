import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useGoogleLogin } from '@react-oauth/google';

// Global styles for HTML, body
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Poppins', sans-serif;
  }

  html, body {
    display: grid;
    height: 100%;
    width: 100%;
    place-items: center;
    background: -webkit-linear-gradient(left, #00f3bb,rgb(112, 169, 156),rgb(8, 171, 133),rgb(101, 160, 146));
  }

  ::selection {
    background: #1a75ff;
    color: #fff;
  }
`;

// Component-specific styles
const LoginSignupWrapper = styled.div`
  .wrapper {
    overflow: hidden;
    max-width: 390px;
    background: #fff;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0px 15px 20px rgba(0, 0, 0, 0.1);
  }

  .wrapper .title-text {
    display: flex;
    width: 200%;
  }

  .wrapper .title {
    width: 50%;
    font-size: 35px;
    font-weight: 600;
    text-align: center;
    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .wrapper .slide-controls {
    position: relative;
    display: flex;
    height: 50px;
    width: 100%;
    overflow: hidden;
    margin: 30px 0 10px 0;
    justify-content: space-between;
    border: 1px solid lightgrey;
    border-radius: 15px;
  }

  .slide-controls .slide {
    height: 100%;
    width: 100%;
    color: #fff;
    font-size: 18px;
    font-weight: 500;
    text-align: center;
    line-height: 48px;
    cursor: pointer;
    z-index: 1;
    transition: all 0.6s ease;
  }

  .slide-controls label.signup {
    color: #000;
  }

  .slide-controls .slider-tab {
    position: absolute;
    height: 100%;
    width: 50%;
    left: 0;
    z-index: 0;
    border-radius: 15px;
    background: -webkit-linear-gradient(left, #003366, #004080, #0059b3, #0073e6);
    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  input[type="radio"] {
    display: none;
  }

  #signup:checked ~ .slider-tab {
    left: 50%;
  }

  #signup:checked ~ label.signup {
    color: #fff;
    cursor: default;
    user-select: none;
  }

  #signup:checked ~ label.login {
    color: #000;
  }

  #login:checked ~ label.signup {
    color: #000;
  }

  #login:checked ~ label.login {
    cursor: default;
    user-select: none;
  }

  .wrapper .form-container {
    width: 100%;
    overflow: hidden;
  }

  .form-container .form-inner {
    display: flex;
    width: 200%;
  }

  .form-container .form-inner form {
    width: 50%;
    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .form-inner form .field {
    height: 50px;
    width: 100%;
    margin-top: 20px;
  }

  .form-inner form .field input {
    height: 100%;
    width: 100%;
    outline: none;
    padding-left: 15px;
    border-radius: 15px;
    border: 1px solid lightgrey;
    border-bottom-width: 2px;
    font-size: 17px;
    transition: all 0.3s ease;
  }

  .form-inner form .field input:focus {
    border-color: #1a75ff;
  }

  .form-inner form .field input::placeholder {
    color: #999;
    transition: all 0.3s ease;
  }

  form .field input:focus::placeholder {
    color: #1a75ff;
  }

  .form-inner form .pass-link {
    margin-top: 5px;
  }

  .form-inner form .signup-link {
    text-align: center;
    margin-top: 30px;
  }

  .form-inner form .pass-link a,
  .form-inner form .signup-link a {
    color: #1a75ff;
    text-decoration: none;
    cursor: pointer;
  }

  .form-inner form .pass-link a:hover,
  .form-inner form .signup-link a:hover {
    text-decoration: underline;
  }

  form .btn {
    height: 50px;
    width: 100%;
    border-radius: 15px;
    position: relative;
    overflow: hidden;
  }

  form .btn .btn-layer {
    height: 100%;
    width: 300%;
    position: absolute;
    left: -100%;
    background: -webkit-linear-gradient(right, #4285f4, #4285f4, #0059b3, #0073e6);
    border-radius: 15px;
    transition: all 0.4s ease;
  }

  form .btn:hover .btn-layer {
    left: 0;
  }

  form .btn input[type="submit"] {
    height: 100%;
    width: 100%;
    z-index: 1;
    position: relative;
    background: none;
    border: none;
    color: #fff;
    padding-left: 0;
    border-radius: 15px;
    font-size: 20px;
    font-weight: 500;
    cursor: pointer;
  }

  .google-login-btn {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .google-login-btn button {
    padding: 10px 20px;
    background: -webkit-linear-gradient(right, #4285f4, #4285f4, #0059b3, #0073e6);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .google-login-btn button:hover {
    background: -webkit-linear-gradient(left, #4285f4, #4285f4, #0059b3, #0073e6); 
    transition: all 0.4s ease;   
  }

  .google-login-btn button img {
    width: 20px;
    height: 20px;
  }

  .error-message {
    color: red;
    text-align: center;
    margin-top: 10px;
  }

  .success-message {
    color: green;
    text-align: center;
    margin-top: 10px;
  }

  .loading-message {
    color: #007bff;
    text-align: center;
    margin-top: 10px;
  }

  .forgot-password-form,
  .reset-password-form {
    margin-top: 20px;
  }

  .forgot-password-form .field,
  .reset-password-form .field {
    height: 50px;
    width: 100%;
    margin-top: 10px;
  }

  .forgot-password-form .field input,
  .reset-password-form .field input {
    height: 100%;
    width: 100%;
    outline: none;
    padding-left: 15px;
    border-radius: 15px;
    border: 1px solid lightgrey;
    border-bottom-width: 2px;
    font-size: 17px;
    transition: all 0.3s ease;
  }

  .forgot-password-form .field input:focus,
  .reset-password-form .field input:focus {
    border-color: #1a75ff;
  }

  .forgot-password-form .field input::placeholder,
  .reset-password-form .field input::placeholder {
    color: #999;
    transition: all 0.3s ease;
  }

  .forgot-password-form .field input:focus::placeholder,
  .reset-password-form .field input:focus::placeholder {
    color: #1a75ff;
  }

  .back-link {
    margin-top: 10px;
    text-align: center;
  }

  .back-link a {
    color: #1a75ff;
    text-decoration: none;
    cursor: pointer;
  }

  .back-link a:hover {
    text-decoration: underline;
  }
`;

const LoginSignup = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSlide = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowForgotPassword(false);
    setShowResetPassword(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://split-screen-backend.vercel.app/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store user in localStorage (for fallback)
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const newUser = { email, password };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      // Redirect to login form
      setIsLogin(true);
      setSuccess('Signup successful! Please login.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Server se connect nahi ho paaya. Please apna network check karein ya thodi der baad try karein.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('https://split-screen-backend.vercel.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const user = { email, password };
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('token', data.token); // Store JWT token
      setSuccess('Login successful!');
      onLogin(user);
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Server se connect nahi ho paaya. Please apna network check karein ya thodi der baad try karein.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('https://split-screen-backend.vercel.app/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Forgot password request failed');
      }

      setSuccess('Reset token generated! Check server logs for the token and enter it below.');
      setShowResetPassword(true);
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Server se connect nahi ho paaya. Please apna network check karein ya thodi der baad try karein.');
      } else {
        setError(err.message || 'Failed to process forgot password request.');
      }
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('https://split-screen-backend.vercel.app/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: resetToken, newPassword }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setSuccess('Password reset successful! Please login with your new password.');
      setShowForgotPassword(false);
      setShowResetPassword(false);
      setEmail('');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Server se connect nahi ho paaya. Please apna network check karein ya thodi der baad try karein.');
      } else {
        setError(err.message || 'Password reset failed. Please try again.');
      }
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        const user = { email: userInfo.email, googleId: userInfo.sub };

        const response = await fetch('https://split-screen-backend.vercel.app/api/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
          credentials: 'include',
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Google login failed');
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', data.token);
        setSuccess('Google login successful!');
        onLogin(user);
      } catch (err) {
        if (err.message.includes('Failed to fetch')) {
          setError('Server se connect nahi ho paaya. Please apna network check karein ya thodi der baad try karein.');
        } else {
          setError(err.message || 'Google login failed. Please try again.');
        }
        console.error('Google login error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
      setIsLoading(false);
    },
  });

  return (
    <>
      <GlobalStyle />
      <LoginSignupWrapper>
        <div className="wrapper">
          <div className="title-text">
            <div className="title login" style={{ marginLeft: isLogin ? '0%' : '-50%' }}>
              Login Form
            </div>
            <div className="title signup" style={{ marginLeft: isLogin ? '0%' : '-50%' }}>
              Signup Form
            </div>
          </div>
          <div className="form-container">
            <div className="slide-controls">
              <input type="radio" name="slide" id="login" checked={isLogin} onChange={handleSlide} />
              <input type="radio" name="slide" id="signup" checked={!isLogin} onChange={handleSlide} />
              <label htmlFor="login" className="slide login">
                Login
              </label>
              <label htmlFor="signup" className="slide signup">
                Signup
              </label>
              <div className="slider-tab"></div>
            </div>
            <div className="form-inner">
              {isLogin && !showForgotPassword && !showResetPassword ? (
                <form className="login" onSubmit={handleLogin}>
                  <div className="field">
                    <input
                      type="text"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="pass-link">
                    <a onClick={() => setShowForgotPassword(true)}>Forgot password?</a>
                  </div>
                  <div className="field btn">
                    <div className="btn-layer"></div>
                    <input type="submit" value="Login" disabled={isLoading} />
                  </div>
                  <div className="signup-link">
                    Not a member? <a onClick={handleSlide}>Signup now</a>
                  </div>
                </form>
              ) : showForgotPassword && !showResetPassword ? (
                <form className="forgot-password-form" onSubmit={handleForgotPassword}>
                  <div className="field">
                    <input
                      type="text"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field btn">
                    <div className="btn-layer"></div>
                    <input type="submit" value="Request Reset Token" disabled={isLoading} />
                  </div>
                  <div className="back-link">
                    <a onClick={() => setShowForgotPassword(false)}>Back to Login</a>
                  </div>
                </form>
              ) : showResetPassword ? (
                <form className="reset-password-form" onSubmit={handleResetPassword}>
                  <div className="field">
                    <input
                      type="text"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <input
                      type="text"
                      placeholder="Reset Token"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field btn">
                    <div className="btn-layer"></div>
                    <input type="submit" value="Reset Password" disabled={isLoading} />
                  </div>
                  <div className="back-link">
                    <a onClick={() => { setShowForgotPassword(false); setShowResetPassword(false); }}>
                      Back to Login
                    </a>
                  </div>
                </form>
              ) : (
                <form className="signup" onSubmit={handleSignup}>
                  <div className="field">
                    <input
                      type="text"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field btn">
                    <div className="btn-layer"></div>
                    <input type="submit" value="Signup" disabled={isLoading} />
                  </div>
                </form>
              )}
            </div>
          </div>
          <div className="google-login-btn">
            <button onClick={() => googleLogin()} disabled={isLoading}>
              <img src="https://www.google.com/favicon.ico" alt="Google" />
              Login with Google
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          {isLoading && <div className="loading-message">Loading...</div>}
        </div>
      </LoginSignupWrapper>
    </>
  );
};

export default LoginSignup;