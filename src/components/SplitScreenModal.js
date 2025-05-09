import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  width: 90%;
  height: 90%;
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4d4d;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease;

  &:hover {
    background: #ff3333;
  }
`;

const SplitScreenContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  margin-top: 60px;
`;

const Screen = styled.iframe`
  flex: 1;
  border: none;
  border-radius: 5px;
  margin: 0 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &.both-screen {
    background-color: #28a745;

    &:hover {
      background-color: #218838;
    }
  }
`;

const SplitScreenModal = ({ leftSrc, rightSrc, setLeftSrc, setRightSrc, onClose }) => {
  const [leftUrl, setLeftUrl] = useState(leftSrc || '');
  const [rightUrl, setRightUrl] = useState(rightSrc || '');
  const [targetScreen, setTargetScreen] = useState('both');
  const leftInputRef = useRef(null);
  const rightInputRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'linkClick') {
        const url = event.data.url;
        if (targetScreen === 'left') {
          setLeftUrl(url);
          setLeftSrc(url);
        } else if (targetScreen === 'right') {
          setRightUrl(url);
          setRightSrc(url);
        } else {
          setLeftUrl(url);
          setRightUrl(url);
          setLeftSrc(url);
          setRightSrc(url);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [targetScreen, setLeftSrc, setRightSrc]);

  const handleLeftInputChange = (e) => {
    setLeftUrl(e.target.value);
  };

  const handleRightInputChange = (e) => {
    setRightUrl(e.target.value);
  };

  const handleLeftInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      setLeftSrc(leftUrl);
    }
  };

  const handleRightInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      setRightSrc(rightUrl);
    }
  };

  const handleLeftInputBlur = () => {
    setLeftSrc(leftUrl);
  };

  const handleRightInputBlur = () => {
    setRightSrc(rightUrl);
  };

  const proxyUrl = (url) => {
    if (!url) return '';
    return `https://split-screen-backend.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose}>×</CloseButton>
        <InputContainer>
          <InputWrapper>
            <UrlInput
              ref={leftInputRef}
              type="text"
              value={leftUrl}
              onChange={handleLeftInputChange}
              onKeyPress={handleLeftInputKeyPress}
              onBlur={handleLeftInputBlur}
              placeholder="Enter URL for left screen"
            />
          </InputWrapper>
          <InputWrapper>
            <UrlInput
              ref={rightInputRef}
              type="text"
              value={rightUrl}
              onChange={handleRightInputChange}
              onKeyPress={handleRightInputKeyPress}
              onBlur={handleRightInputBlur}
              placeholder="Enter URL for right screen"
            />
          </InputWrapper>
          <ButtonContainer>
            <ActionButton onClick={() => setTargetScreen('left')}>
              Left Screen
            </ActionButton>
            <ActionButton className="both-screen" onClick={() => setTargetScreen('both')}>
              Both Screen
            </ActionButton>
            <ActionButton onClick={() => setTargetScreen('right')}>
              Right Screen
            </ActionButton>
          </ButtonContainer>
        </InputContainer>
        <SplitScreenContainer>
          <Screen src={proxyUrl(leftSrc)} />
          <Screen src={proxyUrl(rightSrc)} />
        </SplitScreenContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SplitScreenModal;