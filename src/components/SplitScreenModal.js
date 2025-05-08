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
  width: 100vw; /* Full viewport width */
  height: 100vh; /* Full viewport height */
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center; /* Center vertically */
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
  margin: 0; /* Remove any default margins */
  padding: 0; /* Remove any padding to ensure full coverage */

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalContent = styled.div`
  background: #fff;
  border-radius: 0; /* Remove border-radius to make it edge-to-edge */
  width: 100vw; /* Full viewport width */
  height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column;
  box-shadow: none; /* Remove shadow since it’s full-screen */
  border: none; /* Remove border */
  overflow: hidden;
  font-family: 'Roboto', Arial, sans-serif;
  animation: slideIn 0.4s ease-out;
  margin: 0; /* Ensure no margins */
  padding: 0; /* Ensure no padding */

  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-bottom: 1px solid #dadce0;
  flex-shrink: 0;
  margin: 0; /* Zero margin to stick to the top */
  background: #fff; /* Ensure background matches modal */
  z-index: 1001; /* Ensure it stays above other content */
`

const CloseButton = styled.button`
  margin-left: 30px;
  color: rgb(162, 15, 15);
  border: none;
  width: 40px;
  height: 40px;
  background-color: rgba(214, 9, 9, 0.87);
  cursor: pointer;
  font-weight: 600;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease, color 0.3s ease;

  &:hover {
    background: rgb(151, 17, 17);
    color: white;
  }

  &:active {
    background: rgb(138, 12, 12);
  }
`

const LoginButton = styled.button`
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Roboto', Arial, sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease, box-shadow 0.3s ease;

  &:before {
    content: '';
    display: inline-block;
    width: 18px;
    height: 18px;
    background: url('https://www.google.com/favicon.ico') no-repeat center;
    background-size: contain;
  }

  &:hover {
    background-color: #3267d6;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  &:active {
    background-color: #2a56c6;
  }
`

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none; /* Hide scrollbar in Firefox */
  -ms-overflow-style: none; /* Hide scrollbar in IE/Edge */
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar in Chrome/Safari */
  }

  @media (max-width: 768px) {
    gap: 8px;
  }
`

const StyledInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  width: 200px;
  font-size: 14px;
  font-family: 'Roboto', Arial, sans-serif;
  background: #f8f9fa;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #4285f4;
    outline: none;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }

  &::placeholder {
    color: #5f6368;
  }
`

const FileInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const FileInput = styled.input`
  padding: 8px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Roboto', Arial, sans-serif;
  background: #f8f9fa;
  width: 150px;
`

const UploadButton = styled.button`
  padding: 8px 12px;
  background-color: #34a853;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Roboto', Arial, sans-serif;
  transition: background 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background-color: #2d8e44;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  &:active {
    background-color: #277c3e;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`

const ScreenSelectButton = styled.select`
  padding: 8px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Roboto', Arial, sans-serif;
  background: #f8f9fa;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #4285f4;
    outline: none;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }
`

const ErrorMessage = styled.div`
  color: #d93025;
  margin: 5px 0;
  padding: 8px;
  background: #fce8e6;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  font-family: 'Roboto', Arial, sans-serif;
  animation: fadeInOut 3s ease-in-out;

  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }
`

const SuccessMessage = styled.div`
  color: #34a853;
  margin: 5px 0;
  padding: 8px;
  background: #e8f5e9;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  font-family: 'Roboto', Arial, sans-serif;
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
            color: "#5f6368",
            textAlign: "center",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontFamily: "'Roboto', Arial, sans-serif",
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
              <UploadButton onClick={() => handleUploadComplete("left", leftFile)}>Upload</UploadButton>
            </FileInputWrapper>
            <StyledInput
              type="text"
              placeholder="Enter right URL"
              value={rightSrc || ""}
              onChange={(e) => handleRightSrcChange(e.target.value)}
            />
            <FileInputWrapper>
              <FileInput type="file" onChange={(e) => setRightFile(e.target.files[0])} />
              <UploadButton onClick={() => handleUploadComplete("right", rightFile)}>Upload</UploadButton>
            </FileInputWrapper>
            <ScreenSelectButton value={screenMode} onChange={(e) => setScreenMode(e.target.value)}>
              <option value="both">Both Screens</option>
              <option value="left">Left Screen</option>
              <option value="right">Right Screen</option>
            </ScreenSelectButton>
            <CloseButton onClick={onClose}>×</CloseButton>
          </InputWrapper>
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