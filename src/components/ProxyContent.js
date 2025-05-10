import React, { useEffect, useState, useRef, Suspense } from "react";
import styled from "styled-components";
import mammoth from "mammoth";

const ExcelViewer = React.lazy(() => import("./ExcelViewer"));

// Styling for the tabbed interface
const TabContainer = styled.div`
  display: flex;
  overflow-x: auto;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dadce0;
  padding: 0;
  margin: 0;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  background-color: ${(props) => (props.active ? "#ffffff" : "#f8f9fa")};
  color: ${(props) => (props.active ? "#000000" : "#5f6368")};
  border: none;
  border-right: 1px solid #dadce0;
  font-size: 14px;
  font-family: 'Roboto', Arial, sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.active ? "#f0f0f0" : "#e8eaed")};
  }

  &:focus {
    outline: none;
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
  font-family: 'Roboto', Arial, sans-serif;
  background: #fff;
`;

const ContentWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const PatentIframe = styled.iframe`
  width: 100%;
  max-width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  font-family: 'Roboto', Arial, sans-serif;
  box-sizing: border-box;
`;

const DocViewer = styled.div`
  width: 100%;
  max-width: 100%;
  height: 100%;
  overflow: auto;
  font-family: 'Roboto', Arial, sans-serif;
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
`;

const DownloadLink = styled.a`
  color: rgb(81, 80, 98);
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
  background-color: rgb(85, 88, 92);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background-color: rgb(79, 85, 96);
  }
`;

const ProxyContent = ({ url, backendUrl, onLinkClick, isFileUpload, fileName }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [directIframe, setDirectIframe] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
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

      setHtmlContent(
        `<div style="padding: 20px; font-family: 'Roboto', Arial, sans-serif; max-width: 100%; box-sizing: border-box;">${result.value}</div>`
      );
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
    setHtmlContent(null);
    setError(null);
    setLoading(true);
    setDirectIframe(false);

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
        // For Google Patents, we'll fetch the content and parse it for tabbed view
        const proxyUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        response = await fetchWithRetry(proxyUrl);
        const html = await response.text();
        setHtmlContent(html); // We'll use this HTML to extract tab content
        setDirectIframe(false); // We won't use iframe directly for tabbed view
      } else if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
        setDirectIframe(true);
        setContent({ type: "iframe", url });
      } else if (isPdfUrl(url)) {
        setContent({ type: "pdf", url: `${url}#view=FitH` });
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
      const processedHtml = processHtml(html, url);
      setHtmlContent(processedHtml);
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
          setHtmlContent(null);
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

  // Tabbed Interface for Google Patents
  const renderTabbedInterface = () => {
    const tabs = [
      "Overview", "PDF", "Drawings", "Claims", "Description", "Equivalents",
      "Family", "Priority Map", "Citations Map", "B Citations", "F Citations",
      "Priority Pubs", "Assignments", "Status"
    ];

    const renderTabContent = () => {
      // Parse the HTML content using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      // Helper functions to extract content from HTML using DOM queries
      const extractPatentTitle = () => {
        const titleElement = doc.querySelector('h1[itemprop="title"]');
        return titleElement ? titleElement.textContent.trim() : "Title not found";
      };

      const extractPatentAbstract = () => {
        const abstractElement = doc.querySelector('section[itemprop="abstract"]');
        return abstractElement ? abstractElement.textContent.trim() : "Abstract not found";
      };

      const extractPatentInventors = () => {
        const inventorElements = doc.querySelectorAll('dd[itemprop="inventor"]');
        const inventors = Array.from(inventorElements).map(el => el.textContent.trim());
        return inventors.length > 0 ? inventors.join(", ") : "Inventors not found";
      };

      const extractPatentNumber = () => {
        const numberElement = doc.querySelector('span[itemprop="publicationNumber"]');
        return numberElement ? numberElement.textContent.trim() : "Publication number not found";
      };

      const extractPatentDrawings = () => {
        const drawingElements = doc.querySelectorAll('div.patent-image img');
        if (drawingElements.length > 0) {
          return Array.from(drawingElements).map((img, index) => (
            <img
              key={index}
              src={img.getAttribute("src")}
              alt={`Drawing ${index + 1}`}
              style={{ maxWidth: "100%" }}
            />
          ));
        }
        return <p>No drawings found.</p>;
      };

      const extractPatentClaims = () => {
        const claimsElement = doc.querySelector('section[itemprop="claims"]');
        return claimsElement ? (
          <div dangerouslySetInnerHTML={{ __html: claimsElement.innerHTML }} />
        ) : (
          <p>No claims found.</p>
        );
      };

      const extractPatentDescription = () => {
        const descriptionElement = doc.querySelector('section[itemprop="description"]');
        return descriptionElement ? (
          <div dangerouslySetInnerHTML={{ __html: descriptionElement.innerHTML }} />
        ) : (
          <p>No description found.</p>
        );
      };

      switch (activeTab) {
        case "Overview":
          return (
            <TabContent>
              <h2>Overview</h2>
              {htmlContent ? (
                <div>
                  <h3>{extractPatentTitle()}</h3>
                  <p><strong>Abstract:</strong> {extractPatentAbstract()}</p>
                  <p><strong>Inventors:</strong> {extractPatentInventors()}</p>
                  <p><strong>Publication #:</strong> {extractPatentNumber()}</p>
                </div>
              ) : (
                <p>Loading overview...</p>
              )}
            </TabContent>
          );
        case "PDF":
          return (
            <TabContent>
              <PatentIframe
                src={`${url.replace(/\/patent\//, "/patent/pdf/")}#view=FitH`}
                title="Patent PDF"
                type="application/pdf"
              />
            </TabContent>
          );
        case "Drawings":
          return (
            <TabContent>
              <h2>Drawings</h2>
              {extractPatentDrawings()}
            </TabContent>
          );
        case "Claims":
          return (
            <TabContent>
              <h2>Claims</h2>
              {extractPatentClaims()}
            </TabContent>
          );
        case "Description":
          return (
            <TabContent>
              <h2>Description</h2>
              {extractPatentDescription()}
            </TabContent>
          );
        case "Equivalents":
          return (
            <TabContent>
              <h2>Equivalents</h2>
              <p>Related patents will be listed here.</p>
              {/* Add logic to fetch equivalents */}
            </TabContent>
          );
        case "Family":
          return (
            <TabContent>
              <h2>Family</h2>
              <p>Patent family members will be listed here.</p>
              {/* Add logic to fetch family */}
            </TabContent>
          );
        case "Priority Map":
          return (
            <TabContent>
              <h2>Priority Map</h2>
              <p>Priority dates timeline will be shown here.</p>
              {/* Add logic for priority map */}
            </TabContent>
          );
        case "Citations Map":
          return (
            <TabContent>
              <h2>Citations Map</h2>
              <p>Visual representation of citations will be shown here.</p>
              {/* Add logic for citations map */}
            </TabContent>
          );
        case "B Citations":
          return (
            <TabContent>
              <h2>Backward Citations</h2>
              <p>Backward citations will be listed here.</p>
              {/* Add logic for backward citations */}
            </TabContent>
          );
        case "F Citations":
          return (
            <TabContent>
              <h2>Forward Citations</h2>
              <p>Forward citations will be listed here.</p>
              {/* Add logic for forward citations */}
            </TabContent>
          );
        case "Priority Pubs":
          return (
            <TabContent>
              <h2>Priority Publications</h2>
              <p>Priority publications will be listed here.</p>
              {/* Add logic for priority publications */}
            </TabContent>
          );
        case "Assignments":
          return (
            <TabContent>
              <h2>Assignments</h2>
              <p>Ownership details will be listed here.</p>
              {/* Add logic for assignments */}
            </TabContent>
          );
        case "Status":
          return (
            <TabContent>
              <h2>Status</h2>
              <p>Current legal status will be shown here.</p>
              {/* Add logic for status */}
            </TabContent>
          );
        default:
          return <TabContent>Select a tab to view content.</TabContent>;
      }
    };

    return (
      <ContentWrapper>
        <TabContainer>
          {tabs.map((tab) => (
            <TabButton
              key={tab}
              active={activeTab === tab}
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

  if (isPatentUrl(url) && htmlContent) {
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

  if (htmlContent) {
    return (
      <ContentWrapper>
        <DocViewer dangerouslySetInnerHTML={{ __html: htmlContent }} />
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