"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import SplitScreen from "./SplitScreen"
import ProxyContent from "./ProxyContent"

// Existing styled components remain unchanged except for the new ones below

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
  padding: 0; /* Ensure no padding at the top */

  @keyframes slideIn {
    from { transform: translateY(-30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

// New styled component for the title container
const TitleContainer = styled.div`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`

const Title = styled.h3`
  margin: 0;
  padding: 8px 0 0 0; /* Minimal padding, no bottom padding */
  font-size: 18px;
  font-weight: 700;
  color: rgb(20, 21, 23);
` 

const Subtitle = styled.p`
  margin: 0;
  padding: 0; /* No top padding, some bottom padding for SVG space */
  font-size: 14px;
  color: rgb(18, 19, 21);
  position: relative;
  font-weight: 700;
`

const SVGCurveContainer = styled.div`
  width: 100%;
  height: 20px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
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
  gap: 4px; /* Reduced gap to create more space */
  flex-wrap: nowrap;
  width: 100%;
  flex: 1;

  @media (max-width: 768px) {
    gap: 3px;
  }
`

const SideContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px; /* Reduced gap to create more space */
  flex-wrap: nowrap;
  flex: 1;
  margin: 0 8px; /* Added margin to both sides for symmetry */

  @media (max-width: 768px) {
    gap: 3px;
    margin: 0 4px;
  }
`

const StyledInput = styled.input`
  padding: 5px 6px; /* Reduced padding to make input smaller */
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 12px; /* Reduced font size */
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
  gap: 3px; /* Reduced gap to create more space */
`

const FileInput = styled.input`
  padding: 3px; /* Reduced padding to make input smaller */
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 12px; /* Reduced font size */
  font-family: 'Roboto', Arial, sans-serif;
  background: #f8f9fa;
  min-width: 80px; /* Reduced min-width to make input smaller */
`

const UploadButton = styled.button`
  padding: 5px 6px; /* Reduced padding to make button smaller */
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px; /* Reduced font size */
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
  background: #6034E4;
  color: white;
  padding: 5px; /* Reduced padding to make button smaller */
  font-size: 12px; /* Reduced font size */
  font-family: 'Roboto', Arial, sans-serif;
  cursor: pointer;
  border: 0.5px solid rgb(34, 35, 38);
  border-radius: 4px;
  transition: background 0.3s ease;

  &:hover {
    background: #6034E4;
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
  padding: 0;
`

const ImageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
`

const StyledImage = styled.img`
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  transition: transform 0.3s ease;
  ${({ orientation }) =>
    orientation === "portrait"
      ? `
        object-fit: contain;
        width: auto;
        height: 100vh;
      `
      : `
        object-fit: cover;
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
  z-index: 2100;
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
  z-index: 2100;

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
  // const BACKEND_URL = "http://localhost:5000"
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
          {/* Updated title section with SVG curved line */}
          <TitleContainer>
            <Title>Upload and Compare</Title>
            <Subtitle>Smarter insights with Effortless <span style={{color:'#5F32E4'}}>Side-by-Side</span> Viewing</Subtitle>
            <SVGCurveContainer>
              <svg viewBox="0 0 200 60" style={{ width: '100%', height: '100%', marginLeft:'150px' }}>
                <path
                  d="M10 40 Q100 0 190 40"
                  stroke="#20C9A6"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </SVGCurveContainer>
          </TitleContainer>
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
                  <UploadButton style={{backgroundColor: '#20C9A6',color:'white'}} onClick={() => handleUploadComplete("left", leftFile)}>Upload</UploadButton>
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
                  <UploadButton style={{backgroundColor: '#20C9A6',color:'white',marginRight:'16px'}} onClick={() => handleUploadComplete("right", rightFile)}>Upload</UploadButton>
                </FileInputWrapper>
              </SideContainer>

              {/* <CloseButton onClick={onClose}>×</CloseButton> */}
            </InputWrapper>
          </HeaderContainer>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <SplitScreen leftWidth={1} rightWidth={1} screenMode={screenMode}>
            {renderContent(leftSrc, "left")}
            {renderContent(rightSrc, "right")}
          </SplitScreen>
        </ModalContent>
      </ModalBackground>

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