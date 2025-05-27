"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import SplitScreen from "./SplitScreen"
import ProxyContent from "./ProxyContent"

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
  margin: 0;
  padding: 0;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalContent = styled.div`
  background: #fff;
  border-radius: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: none;
  border: none;
  overflow: hidden;
  font-family: 'Roboto', Arial, sans-serif;
  animation: slideIn 0.3s ease-out;
  margin: 0;
  padding: 0;

  @keyframes slideIn {
    from { transform: translateY(-30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-bottom: 1px solid #dadce0;
  flex-shrink: 0;
  margin: 0;
  background: #fff;
  z-index: 1001;
  width: 100%;
`

const CloseButton = styled.button`
  margin-right: 10px;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  background-color: rgba(17, 14, 14, 0.87);
  cursor: pointer;
  font-weight: 600;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease, color 0.3s ease;

  &:hover {
    background: rgb(78, 71, 71);
    color: red;
  }

  &:active {
    background: rgb(82, 74, 74);
  }
`

const InputWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  width: 100%;
  flex: 1;

  @media (max-width: 768px) {
    gap: 4px;
  }
`

const SideContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  flex: 1;

  @media (max-width: 768px) {
    gap: 4px;
  }
`

const StyledInput = styled.input`
  padding: 6px 8px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Roboto', Arial, sans-serif;
  background: #f8f9fa;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  flex: 1;
  min-width: 0;

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
  gap: 4px;
`

const FileInput = styled.input`
  padding: 4px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Roboto', Arial, sans-serif;
  background: #f8f9fa;
  min-width: 100px;
`

const UploadButton = styled.button`
  padding: 6px 8px;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Roboto', Arial, sans-serif;
  transition: background 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    filter: brightness(90%);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }

  &:active {
    filter: brightness(80%);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`

const ScreenSelectButton = styled.select`
  background: black;
  color: white;
  padding: 6px;
  font-size: 13px;
  font-family: 'Roboto', Arial, sans-serif;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #dadce0;
  transition: background 0.3s ease;

  &:hover {
    background: black;
  }

  &:focus {
    outline: none;
    border-color: white;
  }
`

const ErrorMessage = styled.div`
  color: #d93025;
  margin: 2px 0;
  padding: 4px;
  background: #fce8e6;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
  font-family: 'Roboto', Arial, sans-serif;
  animation: fadeInOut 3s ease-in-out;

  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }
`

// Updated styles for the full-screen image modal
const ImageModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  margin: 0;
  padding: 0;
`

const ImageModalContent = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0; // Removed padding to ensure no extra space
`

const ImageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0; // Removed padding to ensure no extra space
`

const StyledImage = styled.img`
  width: 100vw;
  height: 100vh;
  object-fit: cover; // Use cover to fill the screen while maintaining aspect ratio
  transition: transform 0.3s ease;
  ${({ orientation }) =>
    orientation === "portrait"
      ? `
        object-fit: contain; // Use contain for portrait to avoid cropping
        width: auto;
        height: 100vh;
      `
      : `
        object-fit: cover; // Use cover for landscape to fill the screen
        width: 100vw;
        height: auto;
      `}
`

const ButtonContainer = styled.div`
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2100; // Ensure buttons are above the image
`

const OrientationButton = styled.button`
  padding: 8px 16px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Roboto', Arial, sans-serif;
  transition: background 0.3s ease;

  &:hover {
    background: #3267d6;
  }

  &:active {
    background: #2a56c6;
  }
`

const ImageModalCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  font-weight: 600;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease, color 0.3s ease;
  z-index: 2100; // Ensure close button is above the image

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    color: red;
  }

  &:active {
    background: rgba(0, 0, 0, 1);
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
  const [screenMode, setScreenMode] = useState("both")
  const [leftSrc, setLocalLeftSrc] = useState(initialLeftSrc || "")
  const [rightSrc, setLocalRightSrc] = useState(initialRightSrc || "")
  const [selectedImage, setSelectedImage] = useState(null)
  const [orientation, setOrientation] = useState("landscape")
  // const BACKEND_URL = "https://split-screen-backend.vercel.app"
 const BACKEND_URL ="http://localhost:5000" 

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

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
    setOrientation("landscape")
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
            fontSize: "14px",
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
        onImageClick={handleImageClick}
      />
    )
  }

  return (
    <>
      <ModalBackground onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <HeaderContainer>
            <InputWrapper>
              <SideContainer>
                <StyledInput
                  type="text"
                  placeholder="Enter left URL"
                  value={leftSrc || ""}
                  onChange={(e) => handleLeftSrcChange(e.target.value)}
                />
                <FileInputWrapper>
                  <FileInput type="file" onChange={(e) => setLeftFile(e.target.files[0])} />
                  <UploadButton style={{backgroundColor: '#5367FF',color:'white'}} onClick={() => handleUploadComplete("left", leftFile)}>Upload</UploadButton>
                </FileInputWrapper>
              </SideContainer>

              <ScreenSelectButton value={screenMode} onChange={(e) => setScreenMode(e.target.value)}>
                <option value="both">Both Screens</option>
                <option value="left">Left Screen</option>
                <option value="right">Right Screen</option>
              </ScreenSelectButton>

              <SideContainer>
                <StyledInput
                  type="text"
                  placeholder="Enter right URL"
                  value={rightSrc || ""}
                  onChange={(e) => handleRightSrcChange(e.target.value)}
                />
                <FileInputWrapper>
                  <FileInput type="file" onChange={(e) => setRightFile(e.target.files[0])} />
                  <UploadButton style={{backgroundColor: '#00F3BB'}} onClick={() => handleUploadComplete("right", rightFile)}>Upload</UploadButton>
                </FileInputWrapper>
              </SideContainer>

              <CloseButton onClick={onClose}>×</CloseButton>
            </InputWrapper>
          </HeaderContainer>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <SplitScreen leftWidth={1} rightWidth={1} screenMode={screenMode}>
            {renderContent(leftSrc, "left")}
            {renderContent(rightSrc, "right")}
          </SplitScreen>
        </ModalContent>
      </ModalBackground>

      {/* Full-Screen Image Modal */}
      {selectedImage && (
        <ImageModalBackground onClick={closeImageModal}>
          <ImageModalContent onClick={(e) => e.stopPropagation()}>
            <ImageContainer>
              <StyledImage
                src={selectedImage}
                alt="Full-screen patent drawing"
                orientation={orientation}
              />
            </ImageContainer>
            <ButtonContainer>
              <OrientationButton onClick={() => setOrientation("portrait")}>
                Portrait
              </OrientationButton>
              <OrientationButton onClick={() => setOrientation("landscape")}>
                Landscape
              </OrientationButton>
            </ButtonContainer>
            <ImageModalCloseButton onClick={closeImageModal}>×</ImageModalCloseButton>
          </ImageModalContent>
        </ImageModalBackground>
      )}
    </>
  )
}

export default SplitScreenModal