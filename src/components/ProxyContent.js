import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

const ContentWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
  position: relative;
`;

const FallbackMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
`;

const DownloadLink = styled.a`
  color: #1a73e8;
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    color: #1557b0;
  }
`;

const ProxyContent = ({ url, backendUrl, onLinkClick, isFileUpload, fileName }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  const fetchWithRetry = async (fetchUrl, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(fetchUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://patents.google.com/',
          },
        });
        if (response.ok) {
          const text = await response.clone().text();
          if (text.includes('Google Patents') && text.includes('Search and read the full text of patents')) {
            throw new Error('Received search page instead of patent page');
          }
          return response;
        }
        throw new Error(`Fetch failed: ${response.statusText}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        console.log(`Retrying fetch (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        resolve(html);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseDoc = (file) => {
    return mammoth.convertToHtml({ arrayBuffer: file })
      .then(result => `<div>${result.value}</div>`)
      .catch(err => Promise.reject(err));
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (!url) {
        setContent(null);
        return;
      }

      if (isFileUpload && fileName) {
        const fileExt = fileName.split('.').pop().toLowerCase();
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: blob.type });

          let htmlContent;
          if (fileExt === 'xlsx') {
            htmlContent = await parseExcel(file);
          } else if (fileExt === 'doc' || fileExt === 'docx') {
            const arrayBuffer = await file.arrayBuffer();
            htmlContent = await parseDoc(arrayBuffer);
          } else if (fileExt === 'pdf') {
            setContent({ type: 'file', url });
            return;
          } else {
            setContent({ type: 'file', url });
            return;
          }

          setContent({ type: 'html', data: htmlContent });
        } catch (err) {
          console.error('Error parsing file:', err);
          setError(`Failed to parse file: ${err.message}`);
        }
        return;
      }

      try {
        const fetchUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        console.log(`Fetching content from: ${fetchUrl}`);
        const response = await fetchWithRetry(fetchUrl);

        const contentType = response.headers.get('content-type');
        if (contentType.includes('text/html')) {
          const html = await response.clone().text();
          const script = `
            <script>
              document.addEventListener('click', function(e) {
                const target = e.target.closest('a');
                if (target && target.href) {
                  e.preventDefault();
                  window.parent.postMessage({ type: 'linkClick', url: target.href }, '*');
                }
              });
            </script>
          `;
          const modifiedHtml = html.replace('</body>', `${script}</body>`);
          setContent({ type: 'html', data: modifiedHtml });
        } else {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setContent({ type: 'file', url: blobUrl });
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(`Failed to load content: ${err.message}`);
      }
    };

    fetchContent();
  }, [url, backendUrl, isFileUpload, fileName]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'linkClick' && event.data.url) {
        onLinkClick(event.data.url);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLinkClick]);

  if (error) {
    return <ContentWrapper>Error: {error}</ContentWrapper>;
  }

  if (!content) {
    return <ContentWrapper>Loading...</ContentWrapper>;
  }

  if (content.type === 'html') {
    return (
      <ContentWrapper>
        <iframe
          ref={iframeRef}
          srcDoc={content.data}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Proxy Content"
          sandbox="allow-scripts allow-same-origin"
        />
      </ContentWrapper>
    );
  }

  if (content.type === 'file') {
    return (
      <ContentWrapper>
        <iframe
          src={content.url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="File Content"
          type={content.url.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'}
        />
        <FallbackMessage>
          If the file does not display, you can{' '}
          <DownloadLink href={content.url} download={fileName || 'file'}>
            download it here
          </DownloadLink>.
        </FallbackMessage>
      </ContentWrapper>
    );
  }

  return <ContentWrapper>Unsupported content type</ContentWrapper>;
};

export default ProxyContent;