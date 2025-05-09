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
  box-sizing: border-box;
`;

const PatentIframe = styled.iframe`
  width: 100%;
  max-width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  font-family: 'Roboto', Arial, sans-serif;
  box-sizing: border-box;
  overflow-x: auto;
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
      setLoading(false);
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
        // Try proxy first
        try {
          const proxyUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
          await fetchWithRetry(proxyUrl); // Test if proxy works
          setDirectIframe(true);
          setContent({ type: "iframe", url: proxyUrl });
        } catch (proxyErr) {
          console.warn("Proxy failed, falling back to direct URL:", proxyErr);
          // Fallback to direct URL if proxy fails
          setDirectIframe(true);
          setContent({ type: "iframe", url });
        }
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
      setError(`Failed to load content: ${err.message}. Try opening in a new tab or check if the backend server is running.`);
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

  if (directIframe || content?.type === "iframe") {
    return (
      <ContentWrapper>
        <PatentIframe
          src={content.url}
          title="External Content"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
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