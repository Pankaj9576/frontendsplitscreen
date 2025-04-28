import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

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
          const text = await response.text();
          // Check if the response is a search page
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

  useEffect(() => {
    const fetchContent = async () => {
      if (!url) {
        setContent(null);
        return;
      }

      // Handle file uploads
      if (isFileUpload) {
        setContent({ type: 'file', url });
        return;
      }

      // Handle URL-based content
      try {
        const fetchUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        console.log(`Fetching content from: ${fetchUrl}`);
        const response = await fetchWithRetry(fetchUrl);

        const contentType = response.headers.get('content-type');
        if (contentType.includes('text/html')) {
          let html = await response.text();
          // Inject script to intercept link clicks
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
          html = html.replace('</body>', `${script}</body>`);
          setContent({ type: 'html', data: html });
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
  }, [url, backendUrl, isFileUpload]);

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
          type={content.url.endsWith('.pdf') ? 'application/pdf' : content.url.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/octet-stream'}
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