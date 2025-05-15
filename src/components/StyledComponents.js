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
  background-color: ${(props) => (props.$active ? "#ffffff" : "#f5f5f5")};
  color: ${(props) => (props.$active ? "#1a73e8" : "#333")};
  border: none;
  border-bottom: ${(props) => (props.$active ? "2px solid #1a73e8" : "none")};
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: ${(props) => (props.$active ? "#ffffff" : "#e8e8e8")};
    color: #1a73e8;
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
  overflow-x: scroll; /* Always show horizontal scrollbar */
  overflow-y: auto; /* Vertical scrollbar */
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
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  overflow: hidden; /* Explicitly prevent nested scrollbars */
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
  overflow: hidden; /* Prevent nested scrollbars from children */

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
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  padding: 0;
  box-sizing: border-box;
  overflow-y: hidden; /* Prevent parent vertical scrollbar */
`;

export const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-family: "Arial", sans-serif;
  font-size: 14px;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
`;

export const PatentIframe = styled.iframe`
  width: 100%;
  height: calc(100vh - 100px);
  border: none;
  background: #fff;
  box-sizing: border-box;
`;

export const DocViewer = styled.div`
  width: 100%;
  max-width: 100%;
  padding: 20px;
  background: #fff;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: "Arial", sans-serif;
  line-height: 1.6;
  color: #333;
  flex: 1;
  min-height: calc(100vh - 50px);

  img {
    max-width: 100%;
    height: auto;
    margin: 10px 0;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }

  table {
    max-width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    table-layout: fixed;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
  }

  th {
    background-color: #f2f2f2;
    font-weight: 600;
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

export const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  width: 100%;
  box-sizing: border-box;
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
  padding: 6px 12px;
  background-color: #1a73e8;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #1557b0;
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
  width: 100%;
  box-sizing: border-box;
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
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #666;
  }
`;