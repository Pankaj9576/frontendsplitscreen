import React, { useEffect, useState, useRef, Suspense } from "react";
import styled from "styled-components";
import mammoth from "mammoth";
import { Document, Page, pdfjs } from "react-pdf";

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ExcelViewer = React.lazy(() => import("./ExcelViewer"));

const TabContainer = styled.div`
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

const TabButton = styled.button`
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

const TabContent = styled.div`
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

const ScrollWrapper = styled.div`
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

const PatentTabContent = styled.div`
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

const ContentWrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const PatentIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  box-sizing: border-box;
`;

const DocViewer = styled.div`
  width: 100%;
  height: 100%;
  font-family: 'Arial', sans-serif;
  padding: 10px;
  box-sizing: border-box;

  & > div {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  img, table, p, div {
    max-width: 100%;
    height: auto;
    box-sizing: border-box;
  }
`;

const FallbackMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-family: 'Arial', sans-serif;
`;

const DownloadLink = styled.a`
  color: #1a73e8;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  font-size: 16px;
  color: #5f6368;
  font-family: 'Arial', sans-serif;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
`;

const RetryButton = styled.button`
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

const PptContentWrapper = styled.div`
  padding: 20px;
  background: #fff;
  flex: 1;
  overflow-y: auto;
`;

const ProxyContent = ({ url, backendUrl, onLinkClick, isFileUpload, fileName, side, width }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [patentData, setPatentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [directIframe, setDirectIframe] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [availableTabs, setAvailableTabs] = useState([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pptContent, setPptContent] = useState(null);
  const iframeRef = useRef(null);

  const isPatentUrl = (urlToCheck) => {
    return urlToCheck && urlToCheck.includes("patents.google.com/patent");
  };

  const isDownloadLink = (urlToCheck) => {
    return (
      urlToCheck &&
      !urlToCheck.endsWith(".pdf") &&
      !urlToCheck.includes("/patent/pdf/") &&
      urlToCheck.includes("download")
    );
  };

  const isPdfUrl = (urlToCheck) => {
    return (
      urlToCheck &&
      (urlToCheck.endsWith(".pdf") || urlToCheck.includes("/patent/pdf/"))
    );
  };

  const isPptUrl = (urlToCheck) => {
    return (
      urlToCheck &&
      (urlToCheck.endsWith(".ppt") || urlToCheck.endsWith(".pptx"))
    );
  };

  const fetchWithRetry = async (fetchUrl, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(fetchUrl, {
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.5",
            Referer: "https://patents.google.com/",
          },
        });

        if (response.ok) {
          return response;
        }

        throw new Error(`Fetch failed: ${response.statusText}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        console.log(`Retrying fetch (${i + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const fetchPdfAsBlob = async (pdfUrl) => {
    try {
      const proxyUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(pdfUrl)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: "https://patents.google.com/",
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
      return blobUrl;
    } catch (err) {
      console.error("PDF fetch error:", err);
      throw err;
    }
  };

  const handlePptFile = async (blob, fileName) => {
    try {
      const maxSize = 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
      }

      const fileExt = fileName.split(".").pop().toLowerCase();
      if (!["ppt", "pptx"].includes(fileExt)) {
        throw new Error("Unsupported file type. Please upload a .ppt or .pptx file.");
      }

      // Convert blob to base64 using FileReader
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          // The result includes the data URL prefix (e.g., "data:application/octet-stream;base64,"), so we need to remove it
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Call backend to extract PPT content
      const response = await fetch(`${backendUrl}/api/convert-ppt`, {
        method: "POST",
        body: JSON.stringify({
          fileData: base64String,
          fileName: fileName
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to process PPT: ${await response.text()}`);
      }

      const result = await response.json();
      setPptContent(result.content);
      setContent({ type: "ppt" });
    } catch (err) {
      console.error("Error in handlePptFile:", err);
      setError(
        err.message || "Failed to process PPT document. Try downloading the file instead."
      );
      setContent({
        type: "download",
        url: URL.createObjectURL(blob),
        message: "Unable to render PPT document. Please download to view.",
      });
    }
  };

  const handleWordFile = async (blob, fileName) => {
    try {
      const maxSize = 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
      }

      const fileExt = fileName.split(".").pop().toLowerCase();
      if (!["doc", "docx"].includes(fileExt)) {
        throw new Error("Unsupported file type. Please upload a .doc or .docx file.");
      }

      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer }).catch((err) => {
        console.error("Mammoth conversion error:", err);
        throw new Error(`Failed to convert Word document: ${err.message || "Unknown error"}`);
      });

      if (!result || !result.value) {
        throw new Error("Failed to convert Word document: Empty or invalid content.");
      }

      setContent({
        type: "html",
        data: `<div style="padding: 20px; font-family: 'Arial', sans-serif; max-width: 100%; box-sizing: border-box;">${result.value}</div>`,
      });
    } catch (err) {
      console.error("Error in handleWordFile:", err);
      setError(
        err.message || "Failed to process Word document. Try downloading the file instead."
      );
      setContent({
        type: "download",
        url: URL.createObjectURL(blob),
        message: "Unable to render Word document. Please download to view.",
      });
    }
  };

  const fetchContent = async () => {
    if (!url) {
      setError("No URL or link provided");
      return;
    }

    console.log("Fetching content for URL:", url);
    setContent(null);
    setPatentData(null);
    setError(null);
    setLoading(true);
    setDirectIframe(false);
    setAvailableTabs([]);
    setActiveTab(null);
    setPdfBlobUrl(null);
    setPptContent(null);

    try {
      let response;
      let blob;

      if (isFileUpload && fileName) {
        try {
          response = await fetch(url, { mode: "cors" });
          if (!response.ok) throw new Error(`Blob fetch failed: ${response.status} - ${response.statusText}`);
          blob = await response.blob();

          const fileExt = fileName.split(".").pop().toLowerCase();

          if (["xlsx", "xls"].includes(fileExt)) {
            setContent({ type: "excel", blob });
          } else if (["doc", "docx"].includes(fileExt)) {
            await handleWordFile(blob, fileName);
          } else if (fileExt === "pdf") {
            setContent({ type: "pdf", url: `${url}#view=FitH` });
          } else if (["ppt", "pptx"].includes(fileExt)) {
            await handlePptFile(blob, fileName);
          } else {
            setContent({
              type: "download",
              url,
              message: "This file type is not directly renderable. Please download to view.",
            });
          }
        } catch (err) {
          throw new Error(`Failed to process file: ${err.message}`);
        }
      } else if (isPatentUrl(url)) {
        const proxyUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        response = await fetchWithRetry(proxyUrl);
        const data = await response.json();

        if (data.type === "patent") {
          setPatentData(data.data);
          console.log("Frontend Received Patent Data:", JSON.stringify(data.data, null, 2));
        } else {
          throw new Error("Unexpected response format");
        }
      } else if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
        setDirectIframe(true);
        setContent({ type: "iframe", url });
      } else if (isPdfUrl(url)) {
        console.log("Detected PDF URL, fetching as blob:", url);
        const blobUrl = await fetchPdfAsBlob(url);
        setContent({ type: "pdf", url: `${blobUrl}#view=FitH` });
      } else if (isPptUrl(url)) {
        console.log("Detected PPT URL, processing:", url);
        await handlePptFile(await (await fetch(url)).blob(), url.split('/').pop());
      } else {
        const fetchUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        await handleProxyContent(fetchUrl);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to load content: ${err.message}. Try opening in a new tab.`);
    } finally {
      setLoading(false);
    }
  };

  const handleProxyContent = async (fetchUrl) => {
    const response = await fetchWithRetry(fetchUrl);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      const html = await response.clone().text();
      setContent({ type: "html", data: processHtml(html, url) });
    } else {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (contentType.includes("application/pdf")) {
        setContent({ type: "pdf", url: `${blobUrl}#view=FitH` });
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
        contentType.includes("application/vnd.ms-excel")
      ) {
        setContent({ type: "excel", blob });
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
        contentType.includes("application/msword")
      ) {
        await handleWordFile(blob, "downloaded_document.docx");
      } else {
        setContent({
          type: "download",
          url: blobUrl,
          message: "This file type is not directly renderable. Please download to view.",
        });
      }
    }
  };

  const processHtml = (html, baseUrl) => {
    let processedHtml = html;

    let domain = "";
    try {
      const urlObj = new URL(baseUrl);
      domain = `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (e) {
      console.error("Invalid URL:", baseUrl);
    }

    if (domain) {
      processedHtml = processedHtml.replace(/(href|src)="\/([^"]*)"/g, `$1="${domain}/$2"`);

      processedHtml =
        processedHtml +
        `
        <script>
          document.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && e.target.href) {
              e.preventDefault();
              window.parent.postMessage({
                type: 'linkClick',
                url: e.target.href
              }, '*');
            }
          });
        </script>
      `;
    }

    return processedHtml;
  };

  useEffect(() => {
    console.log("useEffect triggered with URL:", url);
    fetchContent();
  }, [url, backendUrl, isFileUpload, fileName]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "linkClick" && event.data.url) {
        console.log("Received linkClick event with URL:", event.data.url);
        if (isDownloadLink(event.data.url)) {
          const link = document.createElement("a");
          link.href = event.data.url;
          link.download = fileName || "file";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          onLinkClick(event.data.url);
          setContent(null);
          setPatentData(null);
          setError(null);
          setLoading(true);
          setDirectIframe(false);
          fetchContent();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLinkClick, fileName]);

  useEffect(() => {
    if (patentData) {
      const possibleTabs = [
        {
          name: "Overview",
          hasData:
            patentData.title ||
            patentData.abstract ||
            patentData.inventors?.length ||
            patentData.publicationNumber,
        },
        { name: "PDF", hasData: !!patentData.pdfUrl },
        { name: "Images", hasData: patentData.drawings?.length > 0 },
        { name: "Claims", hasData: !!patentData.claims },
        { name: "Description", hasData: !!patentData.description },
        { name: "Classifications", hasData: patentData.classifications?.length > 0 },
        { name: "Citations", hasData: patentData.citations?.length > 0 },
        { name: "Cited By", hasData: patentData.citedBy?.length > 0 },
        { name: "Legal Events", hasData: patentData.legalEvents?.length > 0 },
        { name: "Patent Family", hasData: patentData.patentFamily?.length > 0 },
        { name: "Similar Documents", hasData: patentData.similarDocs?.length > 0 },
      ];

      const tabs = possibleTabs.filter((tab) => tab.hasData);
      if (tabs.length > 0 && !activeTab) {
        setActiveTab(tabs[0].name);
        setAvailableTabs(tabs.map((tab) => tab.name));
      }
    }
  }, [patentData, activeTab]);

  const renderTabbedInterface = () => {
    if (!patentData) return null;

    const handleCitationClick = (number) => {
      const citationUrl = `https://patents.google.com/patent/${number}`;
      console.log("Citation clicked, triggering onLinkClick with URL:", citationUrl);
      onLinkClick(citationUrl);
      fetchContent();
    };

    const renderTabContent = () => {
      switch (activeTab) {
        case "Overview":
          const publicationNumbers = patentData.publicationNumber
            ? patentData.publicationNumber.split(/,\s*/).filter(Boolean)
            : [];
          const publicationDates = patentData.publicationDate
            ? patentData.publicationDate.split(/,\s*/).filter(Boolean)
            : [];

          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Overview</h2>
                {patentData.title && <h2>{patentData.title}</h2>}
                {publicationNumbers.length > 0 && (
                  <p>
                    <strong>Publication Number:</strong>{" "}
                    {publicationNumbers.map((number, index) => (
                      <span key={index}>
                        {number}
                        {index < publicationNumbers.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                )}
                {publicationDates.length > 0 && (
                  <p>
                    <strong>Publication Date:</strong>{" "}
                    {publicationDates.map((date, index) => (
                      <span key={index}>
                        {date}
                        {index < publicationDates.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                )}
                {patentData.filingDate && (
                  <p>
                    <strong>Filing Date:</strong> {patentData.filingDate}
                  </p>
                )}
                {patentData.priorityDate && (
                  <p>
                    <strong>Priority Date:</strong> {patentData.priorityDate}
                  </p>
                )}
                {patentData.inventors?.length > 0 && (
                  <p>
                    <strong>Inventors:</strong> {patentData.inventors.join(", ")}
                  </p>
                )}
                {patentData.assignee && (
                  <p>
                    <strong>Assignee:</strong> {patentData.assignee}
                  </p>
                )}
                {patentData.status && (
                  <p>
                    <strong>Status:</strong> {patentData.status}
                  </p>
                )}
                {patentData.abstract && (
                  <p>
                    <strong>Abstract:</strong> {patentData.abstract}
                  </p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "PDF":
          const pdfUrl = patentData.pdfUrl;
          if (pdfUrl) {
            console.log("PDF tab clicked, triggering onLinkClick with URL:", pdfUrl);
            onLinkClick(pdfUrl);
            return null;
          }
          return <FallbackMessage>No PDF available</FallbackMessage>;
        case "Images":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Images</h2>
                {patentData.drawings.length > 0 ? (
                  patentData.drawings.map((src, index) => (
                    <img key={index} src={src} alt={`Drawing ${index + 1}`} />
                  ))
                ) : (
                  <p>No drawings available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Claims":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Claims</h2>
                {patentData.claims ? (
                  <div dangerouslySetInnerHTML={{ __html: patentData.claims }} />
                ) : (
                  <p>No claims available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Description":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Description</h2>
                {patentData.description ? (
                  <div dangerouslySetInnerHTML={{ __html: patentData.description }} />
                ) : (
                  <p>No description available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Classifications":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Classifications</h2>
                {patentData.classifications.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.classifications.map((cls, index) => (
                        <tr key={index}>
                          <td>{cls.code}</td>
                          <td>{cls.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No classifications available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Citations":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Citations</h2>
                {patentData.citations.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.citations.map((citation, index) => (
                        <tr key={index}>
                          <td>
                            <a
                              href="#"
                              onClick={() => handleCitationClick(citation.number)}
                            >
                              {citation.number}
                            </a>
                          </td>
                          <td>{citation.date}</td>
                          <td>{citation.title}</td>
                          <td>{citation.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No citations available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Cited By":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Cited By</h2>
                {patentData.citedBy.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.citedBy.map((cited, index) => (
                        <tr key={index}>
                          <td>
                            <a
                              href="#"
                              onClick={() => handleCitationClick(cited.number)}
                            >
                              {cited.number}
                            </a>
                          </td>
                          <td>{cited.date}</td>
                          <td>{cited.title}</td>
                          <td>{cited.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No cited by references available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Legal Events":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Legal Events</h2>
                {patentData.legalEvents.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.legalEvents.map((event, index) => (
                        <tr key={index}>
                          <td>{event.date}</td>
                          <td>{event.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No legal events available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Patent Family":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Patent Family</h2>
                {patentData.patentFamily.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.patentFamily.map((family, index) => (
                        <tr key={index}>
                          <td>{family.number}</td>
                          <td>{family.date}</td>
                          <td>{family.country}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No patent family information available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        case "Similar Documents":
          return (
            <ScrollWrapper>
              <PatentTabContent>
                <h2>Similar Documents</h2>
                {patentData.similarDocs.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patentData.similarDocs.map((doc, index) => (
                        <tr key={index}>
                          <td>{doc.number}</td>
                          <td>{doc.date}</td>
                          <td>{doc.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No similar documents available.</p>
                )}
              </PatentTabContent>
            </ScrollWrapper>
          );
        default:
          return null;
      }
    };

    return (
      <ContentWrapper>
        <TabContainer>
          {availableTabs.map((tab) => (
            <TabButton
              key={tab}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </TabButton>
          ))}
        </TabContainer>
        {renderTabContent()}
      </ContentWrapper>
    );
  };

  if (loading) {
    return <LoadingIndicator>Loading...</LoadingIndicator>;
  }

  if (error) {
    return (
      <ErrorContainer>
        <FallbackMessage>{error}</FallbackMessage>
        <RetryButton onClick={fetchContent}>Retry</RetryButton>
      </ErrorContainer>
    );
  }

  if (content) {
    switch (content.type) {
      case "iframe":
        return (
          <PatentIframe
            ref={iframeRef}
            src={content.url}
            title={`${side} iframe`}
          />
        );
      case "html":
        return (
          <TabContent>
            <div dangerouslySetInnerHTML={{ __html: content.data }} />
          </TabContent>
        );
      case "pdf":
        return (
          <ContentWrapper>
            <TabContainer>
              <TabButton
                $active={activeTab === "PDF"}
                onClick={() => setActiveTab("PDF")}
              >
                PDF View
              </TabButton>
            </TabContainer>
            <PptContentWrapper>
              <Document
                file={content.url}
                onLoadSuccess={({ numPages }) => setActiveTab("PDF")}
              >
                {Array.from(new Array(numPages || 1), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={width ? (width / 100) * window.innerWidth * 0.8 : 600}
                  />
                ))}
              </Document>
            </PptContentWrapper>
          </ContentWrapper>
        );
      case "ppt":
        return (
          <ContentWrapper>
            <TabContainer>
              <TabButton
                $active={activeTab === "Content"}
                onClick={() => setActiveTab("Content")}
              >
                Content
              </TabButton>
            </TabContainer>
            <PptContentWrapper>
              <h2>PPT Content</h2>
              {pptContent && pptContent.length > 0 ? (
                pptContent.map((slide, slideIndex) => (
                  <div key={slideIndex}>
                    <h3>Slide {slideIndex + 1}</h3>
                    {slide.map((text, textIndex) => (
                      <p key={textIndex}>{text}</p>
                    ))}
                  </div>
                ))
              ) : (
                <p>No content available to display.</p>
              )}
            </PptContentWrapper>
          </ContentWrapper>
        );
      case "excel":
        return (
          <Suspense fallback={<LoadingIndicator>Loading Excel Viewer...</LoadingIndicator>}>
            <ExcelViewer blob={content.blob} />
          </Suspense>
        );
      case "download":
        return (
          <FallbackMessage>
            {content.message}{" "}
            <DownloadLink href={content.url} download={fileName || "file"}>
              Download
            </DownloadLink>
          </FallbackMessage>
        );
      default:
        return null;
    }
  }

  if (directIframe) {
    return (
      <PatentIframe
        ref={iframeRef}
        src={url}
        title={`${side} iframe`}
      />
    );
  }

  if (patentData) {
    return renderTabbedInterface();
  }

  return <FallbackMessage>Unable to render content.</FallbackMessage>;
};

export default ProxyContent;