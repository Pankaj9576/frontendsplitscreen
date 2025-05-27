import React, { useState } from "react";
import styled from "styled-components";
import { Document, Page, pdfjs } from "react-pdf";

// Use CDN for pdf.worker.js to avoid local file issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ViewerContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 16px;
  color: #666;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  background-color: #fff3f3;
  border: 1px solid #ffcaca;
  border-radius: 4px;
  color: #d32f2f;
  text-align: center;
`;

const SlideContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Slide = styled.div`
  width: 100%;
  position: relative;
`;
// kygijhgjhgjihghjgkjhkjhgkhjgkjh
const Navigation = styled.div`              
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
`;

const NavButton = styled.button`
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DownloadLink = styled.a`
  color: #1a73e8;
  text-decoration: none;
  margin-top: 10px;
  display: inline-block;
  &:hover {
    text-decoration: underline;
  }
`;

const PptViewer = ({ blob }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log("PDF loaded successfully, total pages:", numPages);
    setNumPages(numPages);
    setCurrentPage(1);
    setError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error("PptViewer: Error loading PDF:", err);
    setError(
      `Failed to load PDF: ${err.message}. The file may be corrupted or not a valid PDF.`
    );
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  if (!blob) {
    return <ErrorMessage>No file provided. Please upload a valid PDF or PPT file.</ErrorMessage>;
  }

  // Validate blob type
  if (blob.type !== "application/pdf") {
    return (
      <ErrorMessage>
        Invalid file type: {blob.type || "unknown"}. Expected a PDF file.
        {blob && (
          <div>
            <DownloadLink href={URL.createObjectURL(blob)} download="file">
              Download File
            </DownloadLink>
          </div>
        )}
      </ErrorMessage>
    );
  }

  return (
    <ViewerContainer>
      <Document
        file={blob}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<LoadingMessage>Loading file...</LoadingMessage>}
        error={
          <ErrorMessage>
            {error || "An error occurred while loading the PDF."}
            {blob && (
              <div>
                <DownloadLink href={URL.createObjectURL(blob)} download="file.pdf">
                  Download File
                </DownloadLink>
              </div>
            )}
          </ErrorMessage>
        }
      >
        {numPages ? (
          <>
            <SlideContainer>
              <Slide>
                <Page
                  pageNumber={currentPage}
                  width={800}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Slide>
            </SlideContainer>
            <Navigation>
              <NavButton onClick={handlePrev} disabled={currentPage === 1}>
                Previous
              </NavButton>
              <NavButton onClick={handleNext} disabled={currentPage === numPages}>
                Next
              </NavButton>
            </Navigation>
          </>
        ) : null}
      </Document>
      {error && (
        <ErrorMessage>
          {error}
          {blob && (
            <div>
              <DownloadLink href={URL.createObjectURL(blob)} download="file.pdf">
                Download File
              </DownloadLink>
            </div>
          )}
        </ErrorMessage>
      )}
    </ViewerContainer>
  );
};

export default PptViewer;