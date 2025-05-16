import React, { useEffect, useState, useRef, Suspense } from "react";
import {
  ContentWrapper,
  Toolbar,
  PatentIframe,
  DocViewer,
  LoadingIndicator,
  ErrorContainer,
  DownloadLink,
  RetryButton,
  FallbackMessage,
  NavigationContainer,
  NavButton,
  SlideCounter,
} from "./StyledComponents";
import PatentTabbedInterface from "./PatentTabbedInterface";
import { handleWordFile, handlePptFile } from "./FileHandlers";

const ExcelViewer = React.lazy(() => import("./ExcelViewer"));

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
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const isPatentUrl = (urlToCheck) => {
    try {
      return urlToCheck && new URL(urlToCheck).hostname === "patents.google.com" && urlToCheck.includes("/patent");
    } catch {
      return false;
    }
  };

  const isDownloadLink = (urlToCheck) => {
    try {
      return (
        urlToCheck &&
        !urlToCheck.endsWith(".pdf") &&
        !urlToCheck.includes("/patent/pdf/") &&
        urlToCheck.includes("download")
      );
    } catch {
      return false;
    }
  };

  const isPdfUrl = (urlToCheck) => {
    try {
      return (
        urlToCheck &&
        (urlToCheck.toLowerCase().endsWith(".pdf") || urlToCheck.includes("/patent/pdf/"))
      );
    } catch {
      return false;
    }
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

        throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
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
        throw new Error(`Failed to fetch PDF: ${response.status} - ${response.statusText}`);
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
      processedHtml += `
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

  const handleProxyContent = async (fetchUrl) => {
    const response = await fetchWithRetry(fetchUrl);
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";

    if (contentType.includes("text/html")) {
      const html = await response.text();
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
        await handleWordFile(blob, "downloaded_document.docx", setContent, setError);
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation") ||
        contentType.includes("application/vnd.ms-powerpoint")
      ) {
        await handlePptFile(blob, "downloaded_presentation.pptx", setContent, setError, setSlides);
      } else {
        setContent({
          type: "download",
          url: blobUrl,
          message: "This file type is not directly renderable. Please download to view.",
        });
      }
    }
  };

  const fetchContent = async () => {
    if (!url) {
      setError("No URL or link provided");
      setLoading(false);
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
    setSlides([]);
    setCurrentSlide(0);

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
            await handleWordFile(blob, fileName, setContent, setError);
          } else if (["ppt", "pptx"].includes(fileExt)) {
            await handlePptFile(blob, fileName, setContent, setError, setSlides);
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

        if (data.type === "patent" && data.data) {
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

  useEffect(() => {
    console.log("useEffect triggered with URL:", url);
    fetchContent();
  }, [url, backendUrl, isFileUpload, fileName]);

  // Cleanup for pdfBlobUrl
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    };
  }, [pdfBlobUrl]);

  // Cleanup for content.blobUrl (used for Word and other files)
  useEffect(() => {
    return () => {
      if (content?.blobUrl) {
        URL.revokeObjectURL(content.blobUrl);
      }
      if (content?.type === "download" && content.url) {
        URL.revokeObjectURL(content.url);
      }
    };
  }, [content]);

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
    if (patentData && !activeTab) {
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
      if (tabs.length > 0) {
        setActiveTab(tabs[0].name);
        setAvailableTabs(tabs.map((tab) => tab.name));
      }
    }
  }, [patentData]);

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
            <DownloadLink href={content.url} download={content.fileName || "document"}>
              Download File
            </DownloadLink>
          )}

          <RetryButton onClick={fetchContent}>Retry Loading</RetryButton>

          <RetryButton
            onClick={() => window.open(url, "_blank")}
            style={{ backgroundColor: "#34a853" }}
          >
            Open in New Tab
          </RetryButton>
        </ErrorContainer>
      </ContentWrapper>
    );
  }

  if (isPatentUrl(url) && patentData) {
    return (
      <PatentTabbedInterface
        patentData={patentData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        availableTabs={availableTabs}
        onLinkClick={onLinkClick}
        fetchContent={fetchContent}
      />
    );
  }

  if (directIframe || content?.type === "iframe") {
    return (
      <ContentWrapper>
        <PatentIframe
          ref={iframeRef}
          src={content?.url || url}
          title="External Content"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
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
        <Toolbar>
          <span style={{ marginRight: "auto" }}>
            Document Viewer: {content.fileName || "Word Document"}
          </span>
          {content.blobUrl && (
            <DownloadLink href={content.blobUrl} download={content.fileName || "document.docx"}>
              Download
            </DownloadLink>
          )}
        </Toolbar>
        <DocViewer dangerouslySetInnerHTML={{ __html: content.data }} />
      </ContentWrapper>
    );
  }

  if (content?.type === "pdf") {
    return (
      <ContentWrapper>
        <PatentIframe
          ref={iframeRef}
          src={content.url}
          title="PDF Content"
          type="application/pdf"
        />
      </ContentWrapper>
    );
  }

  if (content?.type === "ppt" && slides.length > 0) {
    return (
      <ContentWrapper>
        <DocViewer dangerouslySetInnerHTML={{ __html: slides[currentSlide] }} />
        <NavigationContainer>
          <NavButton
            onClick={() => setCurrentSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
          >
            Previous
          </NavButton>
          <SlideCounter>
            Slide {currentSlide + 1} of {slides.length}
          </SlideCounter>
          <NavButton
            onClick={() => setCurrentSlide(currentSlide + 1)}
            disabled={currentSlide === slides.length - 1}
          >
            Next
          </NavButton>
        </NavigationContainer>
      </ContentWrapper>
    );
  }

  if (content?.type === "download") {
    return (
      <ContentWrapper>
        <FallbackMessage>
          {content.message || "This file type is not directly renderable. Please download to view."}{" "}
          <DownloadLink href={content.url} download={content.fileName || "file"}>
            Download File
          </DownloadLink>
        </FallbackMessage>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      <FallbackMessage>Unsupported content type</FallbackMessage>
    </ContentWrapper>
  );
};

export default ProxyContent;