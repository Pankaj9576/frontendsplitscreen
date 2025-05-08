"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import SplitScreen from "./SplitScreen"
import { useGoogleLogin } from "@react-oauth/google"
import ProxyContent from "./ProxyContent"

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
  margin: 0;
  padding: 0;
  backdrop-filter: blur(2px);

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 8px;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: none;
  overflow: hidden;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  animation: slideIn 0.4s ease-out;
  margin: 0;
  padding: 0;

  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (min-width: 768px) {
    width: 95vw;
    max-width: 1200px;
    height: 90vh;
    border-radius: 12px;
  }
`

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
  background: #ffffff;
  z-index: 1001;
  width: 100%;
  position: relative;
  box-sizing: border-box;
`

const CloseButton = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #ffffff;
  border: none;
  width: 36px;
  height: 36px;
  background-color: #d32f2f;
  cursor: pointer;
  font-weight: 600;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease, transform 0.2s ease;
  z-index: 1002;

  &:hover {
    background-color: #b71c1c;
    transform: translateY(-50%) scale(1.05);
  }

  &:active {
    background-color: #9a0007;
    transform: translateY(-50%) scale(0.95);
  }
`

const LoginButton = styled.button`
  padding: 8px 16px;
  background-color: #1a73e8;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  max-width: 200px;

  &:before {
    content: '';
    display: inline-block;
    width: 18px;
    height: 18px;
    background: url('https://www.google.com/favicon.ico') no-repeat center;
    background-size: contain;
  }

  &:hover {
    background-color: #1557b0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    background-color: #104080;
    transform: translateY(0);
  }
`

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
  width: calc(100% - 64px);
  flex: 1;

  @media (max-width: 768px) {
    gap: 6px;
  }
`

const StyledInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  background: #f9fafb;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  flex: 1;
  min-width: 180px;

  &:focus {
    border-color: #1a73e8;
    outline: none;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
  }

  &::placeholder {
    color: #6b7280;
  }
`

const FileInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
`

const FileInput = styled.input`
  padding: 8px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  background: #f9fafb;
  flex: 1;
  min-width: 140px;
`

const UploadButton = styled.button`
  padding: 8px 12px;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    filter: brightness(95%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    filter: brightness(85%);
    transform: translateY(0);
  }

  &:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
`

const ScreenSelectButton = styled.select`
  padding: 8px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  background: #f9fafb;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #1a73e8;
    outline: none;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
  }
`

const ErrorMessage = styled.div`
  color: #d32f2f;
  margin: 8px 16px;
  padding: 8px;
  background: #fee2e2;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  animation: fadeInOut 3s ease-in-out;

  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }
`

const SuccessMessage = styled.div`
  color: #2e7d32;
  margin: 8px 16px;
  padding: 8px;
  background: #e8f5e9;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  animation: fadeInOut 3s ease-in-out;

  @keyframes fadeInOut {
    0% { opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
`

const SplitScreenModal = ({
  leftSrc: initialLeftSrc = "",
  rightSrc: initialRightSrc = null,
  setLeftSrc,
  setRightSrc,
  onClose,
}) => {
  const [error, setError] = useState(null)
  const [leftFile, setLeftFile] = useState(null)
  const [rightFile, setRightFile] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [screenMode, setScreenMode] = useState("both")
  const [leftSrc, setLocalLeftSrc] = useState(initialLeftSrc || "")
  const [rightSrc, setLocalRightSrc] = useState(initialRightSrc || "")
  const BACKEND_URL = "https://split-screen-backend.vercel.app"

  useEffect(() => {
    if (!setLeftSrc) {
      console.error("setLeftSrc is not provided")
    } else if (!leftSrc && initialLeftSrc) {
      setLeftSrc(initialLeftSrc)
      setLocalLeftSrc(initialLeftSrc)
    }
  }, [leftSrc, initialLeftSrc, setLeftSrc])

  useEffect(() => {
    if (!setRightSrc) {
      console.error("setRightSrc is not provided")
    } else if (!rightSrc && initialRightSrc) {
      setRightSrc(initialRightSrc)
      setLocalRightSrc(initialRightSrc)
    }
  }, [rightSrc, initialRightSrc, setRightSrc])

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const handleUploadComplete = async (side, file) => {
    if (!file) {
      setError("No file selected")
      return
    }

    try {
      const blobUrl = URL.createObjectURL(file)
      console.log(`File uploaded for ${side} side, Blob URL: ${blobUrl} - Handling client-side, File: ${file.name}`)
      if (side === "left") {
        setLocalLeftSrc(blobUrl)
        if (setLeftSrc) setLeftSrc(blobUrl)
        setLeftFile(file)
      } else {
        setLocalRightSrc(blobUrl)
        if (setRightSrc) setRightSrc(blobUrl)
        setRightFile(file)
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(`Failed to process file: ${err.message}`)
    }
  }

  const handleLinkClick = (side, newUrl) => {
    console.log(`Link clicked: ${newUrl} on ${side} side`)
    if (side === "left") {
      setLocalLeftSrc(newUrl)
      if (setLeftSrc) setLeftSrc(newUrl)
    } else {
      setLocalRightSrc(newUrl)
      if (setRightSrc) setRightSrc(newUrl)
    }
  }

  const handleLeftSrcChange = (value) => {
    setLocalLeftSrc(value)
    if (setLeftSrc) setLeftSrc(value)
  }

  const handleRightSrcChange = (value) => {
    setLocalRightSrc(value)
    if (setRightSrc) setRightSrc(value)
  }

  const renderContent = (src, side) => {
    if (!src) {
      return (
        <div
          style={{
            color: "#6b7280",
            textAlign: "center",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
          }}
        >
          Enter a URL or upload a file to view content
        </div>
      )
    }

    const isBlobUrl = src.startsWith("blob:")
    const file = isBlobUrl ? (side === "left" ? leftFile : rightFile) : null
    return (
      <ProxyContent
        url={src}
        backendUrl={BACKEND_URL}
        onLinkClick={(newUrl) => handleLinkClick(side, newUrl)}
        isFileUpload={isBlobUrl}
        fileName={file ? file.name : null}
      />
    )
  }

  return (
    <ModalBackground onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <HeaderContainer>
          <InputWrapper>
            <StyledInput
              type="text"
              placeholder="Enter left URL"
              value={leftSrc || ""}
              onChange={(e) => handleLeftSrcChange(e.target.value)}
            />
            <FileInputWrapper>
              <FileInput type="file" onChange={(e) => setLeftFile(e.target.files[0])} />
              <UploadButton style={{backgroundColor: '#c2185b'}} onClick={() => handleUploadComplete("left", leftFile)}>Upload</UploadButton>
            </FileInputWrapper>
            <StyledInput
              type="text"
              placeholder="Enter right URL"
              value={rightSrc || ""}
              onChange={(e) => handleRightSrcChange(e.target.value)}
            />
            <FileInputWrapper>
              <FileInput type="file" onChange={(e) => setRightFile(e.target.files[0])} />
              <UploadButton style={{backgroundColor: '#7b1fa2'}} onClick={() => handleUploadComplete("right", rightFile)}>Upload</UploadButton>
            </FileInputWrapper>
            <ScreenSelectButton value={screenMode} onChange={(e) => setScreenMode(e.target.value)}>
              <option value="both">Both Screens</option>
              <option value="left">Left Screen</option>
              <option value="right">Right Screen</option>
            </ScreenSelectButton>
          </InputWrapper>
          <CloseButton onClick={onClose}>×</CloseButton>
        </HeaderContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {showSuccess && <SuccessMessage>Sign-in successful!</SuccessMessage>}
        <SplitScreen leftWidth={1} rightWidth={1} screenMode={screenMode}>
          {renderContent(leftSrc, "left")}
          {renderContent(rightSrc, "right")}
        </SplitScreen>
      </ModalContent>
    </ModalBackground>
  )
}

export default SplitScreenModal