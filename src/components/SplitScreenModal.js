import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SplitScreen from './SplitScreen';
import { useGoogleLogin } from '@react-oauth/google';
import ProxyContent from './ProxyContent';

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #ffffff;
  padding: 10px;
  border-radius: 5px;
  width: 95%;
  max-width: 1400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  border: 2px solid #4CAF50;
  animation: slideIn 0.4s ease-out;
  overflow: hidden;

  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 1024px) {
    width: 98%;
    max-width: 1200px;
    padding: 8px;
  }

  @media (max-width: 768px) {
    width: 98%;
    padding: 5px;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
`;

const CloseButton = styled.button`
  background: #ff4d4f;
  color: white;
  border: none;
  width: 45px;
  height: 45px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover {
    background: #e63946;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const LoginButton = styled.button`
  padding: 8px 12px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #3267d6;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const InputContainer = styled.div`
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px 10px;
  flex-shrink: 0;
  max-height: 80px;
  overflow-y: auto;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
  }
`;

const StyledInput = styled.input`
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  width: 25%;
  font-size: 14px;
  background: #ffffff;

  &:focus {
    border-color: #1a73e8;
    outline: none;
  }

  &::placeholder {
    color: #777;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const FileInput = styled.input`
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  width: 20%;
  font-size: 14px;
  background: #ffffff;

  &:focus {
    border-color: #1a73e8;
    outline: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const UploadButton = styled.button`
  padding: 8px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #388e3c;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ScreenSelectButton = styled.select`
  padding: 8px;
  border: 2px solid #e0e0e0;
  width: 120px;
  border-radius: 5px;
  font-size: 14px;
  background: #ffffff;
  cursor: pointer;

  &:focus {
    border-color: #1a73e8;
    outline: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  margin: 5px 0;
  padding: 8px;
  background: #ffe6e6;
  border-radius: 5px;
  text-align: center;
`;

const SplitScreenModal = ({ leftSrc, rightSrc, setLeftSrc, setRightSrc, onClose }) => {
  const [error, setError] = useState(null);
  const [leftFile, setLeftFile] = useState(null);
  const [rightFile, setRightFile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [screenMode, setScreenMode] = useState('both');
  const BACKEND_URL = 'https://split-screen-backend.vercel.app';

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google login success:', tokenResponse);
      setIsAuthenticated(true);
      setShowSuccess(true);
    },
    onError: (error) => console.error('Google login error:', error),
    flow: 'implicit',
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleUploadComplete = async (side, file) => {
    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      const blobUrl = URL.createObjectURL(file);
      console.log(`File uploaded for ${side} side, Blob URL: ${blobUrl} - Handling client-side`);
      if (side === 'left') {
        setLeftSrc(blobUrl);
        setLeftFile(file); // Keep the file for the fileName prop
      } else {
        setRightSrc(blobUrl);
        setRightFile(file); // Keep the file for the fileName prop
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to process file: ${err.message}`);
    }
  };

  const handleLinkClick = (side, newUrl) => {
    console.log(`Link clicked: ${newUrl} on ${side} side`);
    if (side === 'left') {
      setLeftSrc(newUrl);
    } else {
      setRightSrc(newUrl);
    }
  };

  const renderContent = (src, side) => {
    if (!src) {
      return (
        <div style={{ color: '#666', textAlign: 'center', height: '100%' }}>
          Enter a URL, upload a file to view content
        </div>
      );
    }

    // Check if the src is a blob URL (from file upload)
    const isBlobUrl = src.startsWith('blob:');
    return (
      <ProxyContent
        url={src}
        backendUrl={BACKEND_URL}
        onLinkClick={(newUrl) => handleLinkClick(side, newUrl)}
        isFileUpload={isBlobUrl}
        fileName={isBlobUrl ? (side === 'left' ? leftFile?.name : rightFile?.name) : null}
      />
    );
  };

  return (
    <ModalBackground onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <HeaderContainer>
          <InputWrapper>
            <StyledInput
              type="text"
              placeholder="Enter left URL"
              value={leftSrc}
              onChange={(e) => setLeftSrc(e.target.value)}
            />
            <FileInput
              type="file"
              onChange={(e) => setLeftFile(e.target.files[0])}
            />
            <UploadButton onClick={() => handleUploadComplete('left', leftFile)}>↑</UploadButton>
            <StyledInput
              type="text"
              placeholder="Enter right URL"
              value={rightSrc}
              onChange={(e) => setRightSrc(e.target.value)}
            />
            <FileInput
              type="file"
              onChange={(e) => setRightFile(e.target.files[0])}
            />
            <UploadButton onClick={() => handleUploadComplete('right', rightFile)}>↑</UploadButton>
            <ScreenSelectButton
              value={screenMode}
              onChange={(e) => setScreenMode(e.target.value)}
            >
              <option value="both">Both Screen</option>
              <option value="left">Left Screen</option>
              <option value="right">Right Screen</option>
            </ScreenSelectButton>
            {!isAuthenticated && <LoginButton onClick={() => googleLogin()}>Login with Google</LoginButton>}
            <CloseButton onClick={onClose}>×</CloseButton>
          </InputWrapper>
        </HeaderContainer>
        <InputContainer>
          <InputWrapper />
        </InputContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <SplitScreen leftWidth={1} rightWidth={1} screenMode={screenMode}>
          {renderContent(leftSrc, 'left')}
          {renderContent(rightSrc, 'right')}
        </SplitScreen>
      </ModalContent>
    </ModalBackground>
  );
};

export default SplitScreenModal;