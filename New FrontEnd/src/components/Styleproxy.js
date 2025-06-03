import styled from "styled-components";

export const TabContainer = styled.div`
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
  padding: 0;
  margin: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
`;

export const TabButton = styled.button`
  padding: 6px 12px;
  background-color: ${(props) => (props.$active ? "#E6DFFB" : "#E6DFFB")};
  color: ${(props) => (props.$active ? "#f75b8c" : "#333")};
  border: none;
  border-bottom: ${(props) => (props.$active ? "2px solid black" : "none")};
  font-size: 13px;
  font-family: 'Arial', sans-serif;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
  &:hover {
    background-color: ${(props) => (props.$active ? "#E6DFFB" : "#E6DFFB")};
    color: #704AE7;
  }
  &:focus {
    outline: none;
  }
`;

export const TabContent = styled.div`
  flex: 1;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: #fff;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  text-align: left;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  height: calc(100vh - 60px);
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1a73e8;
    margin-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 5px;
  }
  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 10px 0;
  }
  p {
    margin: 8px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  strong {
    font-weight: 600;
    color: #333;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }
  img {
    max-width: 100%;
    margin: 10px 0;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }
  ul, ol {
    padding-left: 20px;
    margin: 10px 0;
  }
  li {
    margin: 5px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    table-layout: fixed;
  }
  th, td {
    padding: 8px;
    border: 1px solid #e0e0e0;
    text-align: left;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }
  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
  a {
    color: #1a73e8;
    text-decoration: none;
    cursor: pointer;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }
  a:hover {
    text-decoration: underline;
  }
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
`;

export const ScrollWrapper = styled.div`
  width: 100%;
  height: calc(100vh - 60px);
  overflow-x: auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
`;

export const PatentTabContent = styled.div`
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: #fff;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-wrap: break-word;
  word-break: break-word;
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1a73e8;
    margin-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 5px;
    white-space: normal;
  }
  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 10px 0;
    white-space: normal;
  }
  p {
    margin: 8px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  strong {
    font-weight: 600;
    color: #333;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }
  img {
    max-width: 100%;
    margin: 10px 0;
  }
  ul, ol {
    padding-left: 20px;
    margin: 10px 0;
  }
  li {
    margin: 5px 0;
    color: #555;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }
  table {
    max-width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    table-layout: fixed;
  }
  th, td {
    padding: 8px;
    border: 1px solid #e0e0e0;
    text-align: left;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }
  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
  a {
    color: #1a73e8;
    text-decoration: none;
    cursor: pointer;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    white-space: normal;
  }
  a:hover {
    text-decoration: underline;
  }
`;

export const ContentWrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const PatentIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  box-sizing: border-box;
`;

export const DocViewer = styled.div`
  width: 100%;
  flex: 1;
  padding: 20px;
  box-sizing: border-box;
  display: block;
  overflow: auto;
  background: #f5f5f5;
  text-align: left;
  & > div {
    margin: 0;
    padding: 0;
    position: relative;
  }
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
`;

export const SlideContainer = styled.div`
  width: ${(props) => props.width || "960px"};
  height: ${(props) => props.height || "720px"};
  max-width: 100%;
  max-height: 100%;
  border: 2px solid #d3d3d3;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: ${(props) => props.background || "#fff"};
  position: relative;
  overflow: hidden;
`;

export const SlideText = styled.p`
  position: absolute;
  left: ${(props) => props.x || "15px"};
  top: ${(props) => props.y || "15px"};
  font-size: ${(props) => props.fontSize || "14px"};
  color: ${(props) => props.color || "#000000"};
  font-family: ${(props) => props.fontFamily || "'Arial', sans-serif"};
  font-weight: ${(props) => (props.isBold ? "bold" : "normal")};
  font-style: ${(props) => (props.isItalic ? "italic" : "normal")};
  text-align: ${(props) => props.textAlign || "left"};
  line-height: ${(props) => props.lineHeight || "1.2"};
  white-space: pre-wrap;
  margin: 0;
  padding: ${(props) => props.padding || "0"};
  text-decoration: ${(props) => props.textDecoration || "none"};
  z-index: 2;
  width: ${(props) => props.width || "auto"};
`;

export const SlideImage = styled.img`
  position: absolute;
  left: ${(props) => props.x || "0px"};
  top: ${(props) => props.y || "0px"};
  width: ${(props) => props.width || "auto"};
  height: ${(props) => props.height || "auto"};
  max-width: 100%;
  max-height: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  z-index: 2;
  object-fit: contain;
`;

export const SlideBackgroundImage = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: ${(props) => props.opacity || 1};
  object-fit: cover;
`;

export const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  width: 100%;
  box-sizing: border-box;
  position: sticky;
  bottom: 0;
  z-index: 10;
`;

export const NavButton = styled.button`
  padding: 8px 16px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #1557b0;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export const SlideCounter = styled.span`
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  color: #333;
`;

export const FallbackMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-family: 'Arial', sans-serif;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin: 10px;
`;

export const DownloadLink = styled.a`
  color: #1a73e8;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  font-size: 16px;
  color: #5f6368;
  font-family: 'Arial', sans-serif;
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
`;

export const RetryButton = styled.button`
  padding: 8px 16px;
  background-color: #555;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  &:hover {
    background-color: #666;
  }
`;

export const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Align to top */
  padding-top: 10px; /* Reduced padding to ensure it starts closer to the top */
  z-index: 2000; /* Increased z-index to ensure it appears above other elements like the green line */
  overflow: hidden;
  animation: fadeIn 0.3s ease-in-out;

  &:focus {
    outline: none;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const ModalImage = styled.img`
  width: 800px; /* Fixed width as requested */
  height: 800px; /* Fixed height as requested */
  max-width: 90vw; /* Ensure it doesn't overflow on smaller screens */
  max-height: 90vh; /* Ensure it doesn't overflow vertically */
  object-fit: contain;
  border: 2px solid #fff;
  border-radius: 8px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
`;

export const NavigationBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  margin-top: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const ModalNavButton = styled.button`
  padding: 6px 14px;
  background-color: ${(props) =>
    props.$isActive ? "#1a73e8" : "#666"};
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  font-weight: 500;
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background-color: ${(props) =>
      props.$isActive ? "#1557b0" : "#888"};
    transform: scale(1.05);
  }
  &:focus {
    outline: 2px solid #1a73e8;
    outline-offset: 2px;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: #ffffff;
  color: #333;
  border: 1px solid #dadce0;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 24px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease, color 0.2s ease;
  &:hover {
    background: #f1f3f4;
    color: #d93025;
  }
  &:focus {
    outline: 2px solid #1a73e8;
    outline-offset: 2px;
  }
`;

export const ThumbnailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  padding: 20px;
`;

export const Thumbnail = styled.img`
  width: 100%;
  height: 100px;
  object-fit: cover;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.05);
  }
`;

export const SlideshowContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100% - 60px);
  padding: 10px;
  box-sizing: border-box;
`;

export const SlideshowImage = styled.img`
  width: 100%;
  height: 100%;
  max-width: 800px;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #dadce0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

export const StyledImage = styled.img`
  width: 580px;
  height: 470px;
  object-fit: contain;
  image-rendering: crisp-edges;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 5px;
`;