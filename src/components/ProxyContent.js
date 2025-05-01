import React, { useEffect, useState, useRef, Suspense } from "react";
import styled from "styled-components";
import mammoth from "mammoth";

const ExcelViewer = React.lazy(() => import("./ExcelViewer"));

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
  height: 100%;
  border: none;
  min-width: 1500px;
  background: #fff;
  font-family: 'Roboto', Arial, sans-serif;
`;

const FallbackMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
`;

const DownloadLink = styled.a`
  color: #1a0dab;
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
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background-color: #3267d6;
  }
`;

const ProxyContent = ({ url, backendUrl, onLinkClick, isFileUpload, fileName }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [directIframe, setDirectIframe] = useState(false);
  const iframeRef = useRef(null);

  const isPatentUrl = (urlToCheck) => {
    return urlToCheck && urlToCheck.includes("patents.google.com/patent");
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

  const handleWordFile = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(`<div style="padding: 20px; font-family: 'Roboto', Arial, sans-serif;">${result.value}</div>`);
    } catch (err) {
      setError(`Failed to process Word document: ${err.message}`);
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
            await handleWordFile(blob);
          } else if (fileExt === "pdf") {
            setContent({ type: "pdf", url });
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
        setDirectIframe(true);
        setContent({ type: "iframe", url: proxyUrl });
      } else if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
        setDirectIframe(true);
        setContent({ type: "iframe", url });
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
        setContent({ type: "pdf", url: blobUrl });
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
        contentType.includes("application/vnd.ms-excel")
      ) {
        setContent({ type: "excel", blob });
      } else if (
        contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
        contentType.includes("application/msword")
      ) {
        await handleWordFile(blob);
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
        onLinkClick(event.data.url);
        // Trigger automatic search by updating the URL and fetching content
        setContent(null);
        setHtmlContent(null);
        setError(null);
        setLoading(true);
        setDirectIframe(false);
        fetchContent();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLinkClick]);

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
              borderRadius: 8,
              textAlign: "center",
              fontSize: "16px",
              marginBottom: "10px",
              width: "100%",
            }}
          >
            {error}
          </div>

          {content?.type === "download" && (
            <DownloadLink href={content.url} download>
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
        <PatentIframe
          ref={iframeRef}
          srcDoc={htmlContent}
          title="Proxy Content"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
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
        <FallbackMessage>
          If the file does not display, you can{" "}
          <DownloadLink href={content.url} download={fileName || "file"}>
            download it here
          </DownloadLink>
          .
        </FallbackMessage>
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
          .
        </FallbackMessage>
      </ContentWrapper>
    );
  }

  return <ContentWrapper>Unsupported content type</ContentWrapper>;
};

export default ProxyContent;//commit