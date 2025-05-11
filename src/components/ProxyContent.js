import React, { useEffect, useState, useRef, Suspense } from "react";
import styled from "styled-components";
import mammoth from "mammoth";

const ExcelViewer = React.lazy(() => import("./ExcelViewer"));

// Basic styling
const TabContainer = styled.div`
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
  padding: 0;
  margin: 0;
  width: 100%;
  overflow-x: auto; /* Enable horizontal scrolling */
  overflow-y: hidden; /* Disable vertical scrolling */
  white-space: nowrap; /* Keep tabs in a single line */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on touch devices */
  scrollbar-width: thin; /* Firefox scrollbar styling */
  &::-webkit-scrollbar {
    height: 6px; /* Scrollbar height for horizontal scroll */
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
  padding: 12px 24px;
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
    word-wrap: break-word;
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
    word-wrap: break-word;
  }

  th, td {
    padding: 8px;
    border: 1px solid #e0e0e0;
    text-align: left;
    line-height: 19pt;
    font-size: 10pt;
    font-family: "Inter", sans-serif;
    word-wrap: break-word;
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
`;

const ContentWrapper = styled.div`
  height: 100vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #fff;
  }
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

const ProxyContent = ({ url, backendUrl, onLinkClick, isFileUpload, fileName }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [patentData, setPatentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [directIframe, setDirectIframe] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [availableTabs, setAvailableTabs] = useState([]);
  const iframeRef = useRef(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

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
        const blobUrl = await fetchPdfAsBlob(url);
        setContent({ type: "pdf", url: `${blobUrl}#view=FitH` });
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
    fetchContent();
  }, [url, backendUrl, isFileUpload, fileName]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "linkClick" && event.data.url) {
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

  const renderTabbedInterface = () => {
    if (!patentData) return null;

    const possibleTabs = [
      {
        name: "Overview",
        hasData:
          patentData.title ||
          patentData.abstract ||
          patentData.inventors?.length ||
          patentData.publicationNumber,
      },
      { name: "PDF", hasData: true },
      { name: "Drawings", hasData: patentData.drawings?.length > 0 },
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

    const handleCitationClick = (number) => {
      const citationUrl = `https://patents.google.com/patent/${number}`;
      onLinkClick(citationUrl);
      fetchContent();
    };

    const renderTabContent = () => {
      switch (activeTab) {
        case "Overview":
          return (
            <TabContent>
              <h2>Overview</h2>
              {patentData.title && <h3>{patentData.title}</h3>}
              {patentData.publicationNumber && (
                <p>
                  <strong>Publication Number:</strong> {patentData.publicationNumber}
                </p>
              )}
              {patentData.publicationDate && (
                <p>
                  <strong>Publication Date:</strong> {patentData.publicationDate}
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
            </TabContent>
          );
        case "PDF":
          const pdfUrl = patentData.pdfUrl;
          return (
            <TabContent>
              <FallbackMessage>
                <DownloadLink href={pdfUrl} target="_blank">
                  Open PDF in New Tab
                </DownloadLink>
                {" | "}
                <DownloadLink href={pdfUrl} download>
                  Download PDF
                </DownloadLink>
              </FallbackMessage>
            </TabContent>
          );
        case "Drawings":
          return (
            <TabContent>
              <h2>Drawings</h2>
              {patentData.drawings?.length > 0 ? (
                patentData.drawings.map((drawing, index) => (
                  <img
                    key={index}
                    src={drawing}
                    alt={`Drawing ${index + 1}`}
                    style={{ maxWidth: "100%" }}
                  />
                ))
              ) : (
                <p>No drawings found.</p>
              )}
            </TabContent>
          );
        case "Claims":
          return (
            <TabContent>
              <h2>Claims</h2>
              {patentData.claims ? (
                <div dangerouslySetInnerHTML={{ __html: patentData.claims }} />
              ) : (
                <p>No claims found.</p>
              )}
            </TabContent>
          );
        case "Description":
          return (
            <TabContent>
              <h2>Description</h2>
              {patentData.description ? (
                <div dangerouslySetInnerHTML={{ __html: patentData.description }} />
              ) : (
                <p>No description found.</p>
              )}
            </TabContent>
          );
        case "Classifications":
          return (
            <TabContent>
              <h2>Classifications</h2>
              {patentData.classifications?.length > 0 ? (
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
                        <td>{cls.code || "N/A"}</td>
                        <td>{cls.description || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No classifications found.</p>
              )}
            </TabContent>
          );
        case "Citations":
          return (
            <TabContent>
              <h2>Citations</h2>
              {patentData.citations?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Publication Number</th>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patentData.citations.map((citation, index) => (
                      <tr key={index}>
                        <td>
                          {citation.number ? (
                            <a onClick={() => handleCitationClick(citation.number)}>
                              {citation.number}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>{citation.date || "N/A"}</td>
                        <td>{citation.title || "N/A"}</td>
                        <td>{citation.assignee || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No citations found.</p>
              )}
            </TabContent>
          );
        case "Cited By":
          return (
            <TabContent>
              <h2>Cited By</h2>
              {patentData.citedBy?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Publication Number</th>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patentData.citedBy.map((cite, index) => (
                      <tr key={index}>
                        <td>
                          {cite.number ? (
                            <a onClick={() => handleCitationClick(cite.number)}>
                              {cite.number}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>{cite.date || "N/A"}</td>
                        <td>{cite.title || "N/A"}</td>
                        <td>{cite.assignee || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No cited by documents found.</p>
              )}
            </TabContent>
          );
        case "Legal Events":
          return (
            <TabContent>
              <h2>Legal Events</h2>
              {patentData.legalEvents?.length > 0 ? (
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
                        <td>{event.date || "N/A"}</td>
                        <td>{event.description || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No legal events found.</p>
              )}
            </TabContent>
          );
        case "Patent Family":
          return (
            <TabContent>
              <h2>Patent Family</h2>
              {patentData.patentFamily?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Publication Number</th>
                      <th>Date</th>
                      <th>Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patentData.patentFamily.map((family, index) => (
                      <tr key={index}>
                        <td>{family.number || "N/A"}</td>
                        <td>{family.date || "N/A"}</td>
                        <td>{family.country || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No patent family found.</p>
              )}
            </TabContent>
          );
        case "Similar Documents":
          return (
            <TabContent>
              <h2>Similar Documents</h2>
              {patentData.similarDocs?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Publication Number</th>
                      <th>Date</th>
                      <th>Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patentData.similarDocs.map((doc, index) => (
                      <tr key={index}>
                        <td>{doc.number || "N/A"}</td>
                        <td>{doc.date || "N/A"}</td>
                        <td>{doc.title || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No similar documents found.</p>
              )}
            </TabContent>
          );
        default:
          return <TabContent>Select a tab to view content.</TabContent>;
      }
    };

    return (
      <ContentWrapper>
        <TabContainer>
          {availableTabs.map((tab) => (
            <TabButton
              key={tab}
              $active={activeTab === tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "PDF" && patentData.pdfUrl && !pdfBlobUrl) {
                  fetchPdfAsBlob(patentData.pdfUrl).catch((err) => {
                    setError(`Failed to load PDF: ${err.message}`);
                  });
                }
              }}
            >
              {tab}
            </TabButton>
          ))}
        </TabContainer>
        {activeTab && renderTabContent()}
      </ContentWrapper>
    );
  };

  if (loading) {
    return <LoadingIndicator>Loading content...</LoadingIndicator>;
  }

  if (error) {
    return (
      <ContentWrapper>
        <ErrorContainer>
          <div
            style={{
              color: "#d93025",
              padding: 12,
              background: "#fce8e6",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "16px",
              marginBottom: "10px",
              width: "100%",
            }}
          >
            {error}
          </div>

          {content?.type === "download" && (
            <DownloadLink href={content.url} download={fileName || "document"}>
              Download File
            </DownloadLink>
          )}

          <RetryButton onClick={fetchContent}>Retry Loading</RetryButton>

          <RetryButton onClick={() => window.open(url, "_blank")} style={{ backgroundColor: "#34a853" }}>
            Open in New Tab
          </RetryButton>
        </ErrorContainer>
      </ContentWrapper>
    );
  }

  if (isPatentUrl(url) && patentData) {
    return renderTabbedInterface();
  }

  if (directIframe || content?.type === "iframe") {
    return (
      <ContentWrapper>
        <PatentIframe
          src={content.url}
          title="External Content"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </ContentWrapper>
    );
  }

  if (content?.type === "excel") {
    return (
      <Suspense fallback={<LoadingIndicator>Loading Excel content...</LoadingIndicator>}>
        <ExcelViewer blob={content.blob} />
      </Suspense>
    );
  }

  if (content?.type === "html") {
    return (
      <ContentWrapper>
        <DocViewer dangerouslySetInnerHTML={{ __html: content.data }} />
      </ContentWrapper>
    );
  }

  if (content?.type === "pdf") {
    return (
      <ContentWrapper>
        <PatentIframe
          src={content.url}
          title="File Content"
          type="application/pdf"
        />
      </ContentWrapper>
    );
  }

  if (content?.type === "download") {
    return (
      <ContentWrapper>
        <FallbackMessage>
          {content.message || "This file type is not directly renderable. Please download to view."}{" "}
          <DownloadLink href={content.url} download={fileName || "file"}>
            Download File
          </DownloadLink>
        </FallbackMessage>
      </ContentWrapper>
    );
  }

  return <ContentWrapper>Unsupported content type</ContentWrapper>;
};

export default ProxyContent;