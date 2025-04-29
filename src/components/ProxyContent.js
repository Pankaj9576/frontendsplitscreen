import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

const ContentWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
  position: relative;
  display: flex;
  flex-direction: column;
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

const SheetSelector = styled.div`
  padding: 10px;
  text-align: center;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
`;

const Select = styled.select`
  padding: 5px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ProxyContent = ({ url, backendUrl, onLinkClick, isFileUpload, fileName }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState({ html: null, activeSheet: null });
  const [htmlContent, setHtmlContent] = useState(null);
  const iframeRef = useRef(null);
  const contentRef = useRef(null);

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

  const handleExcelFile = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
    const sheets = {};
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const html = XLSX.utils.sheet_to_html(worksheet, {
        editable: false,
        id: `sheet-${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}`,
      });
      sheets[sheetName] = html;
    });
    if (Object.keys(sheets).length === 0) throw new Error('No valid sheets found in the Excel file');
    setTableData({ html: sheets, activeSheet: Object.keys(sheets)[0] });
  };

  const handleWordFile = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    setHtmlContent(`<div>${result.value}</div>`);
  };

  const fetchContent = async () => {
    if (!url) {
      setError('No URL or link provided');
      return;
    }
    console.log('Fetching content for URL:', url);
    setContent(null);
    setTableData({ html: null, activeSheet: null });
    setHtmlContent(null);
    setError(null);

    try {
      let response;
      if (isFileUpload && fileName) {
        response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Blob fetch failed: ${response.status} - ${response.statusText}`);
        const blob = await response.blob();
        const fileExt = fileName.split('.').pop().toLowerCase();

        if (['xlsx', 'xls'].includes(fileExt)) {
          await handleExcelFile(blob);
        } else if (['doc', 'docx'].includes(fileExt)) {
          await handleWordFile(blob);
        } else if (fileExt === 'pdf') {
          setContent({ type: 'pdf', url });
        } else {
          setContent({ type: 'download', url, message: 'This file type is not directly renderable. Please download to view.' });
        }
        return;
      }

      const fetchUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
      response = await fetchWithRetry(fetchUrl);

      const contentType = response.headers.get('content-type');
      if (contentType.includes('text/html')) {
        const html = await response.clone().text();
        setHtmlContent(html);
      } else {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        if (contentType.includes('application/pdf')) {
          setContent({ type: 'pdf', url: blobUrl });
        } else {
          setContent({ type: 'download', url: blobUrl, message: 'This file type is not directly renderable. Please download to view.' });
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to load content: ${err.message}.`);
      if (url.startsWith('blob:')) {
        try {
          const blob = await fetch(url, { mode: 'cors' }).then((res) => res.blob());
          setContent({ type: 'download', url: URL.createObjectURL(blob) });
        } catch (blobErr) {
          console.error('Blob fallback error:', blobErr);
        }
      }
    }
  };

  const handleSheetChange = (e) => {
    setTableData((prev) => ({ ...prev, activeSheet: e.target.value }));
  };

  useEffect(() => {
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
    return (
      <ContentWrapper>
        <div style={{ color: '#ff4d4f', padding: 12, background: '#ffe6e6', borderRadius: 8, textAlign: 'center', fontSize: 16 }}>
          {error}
          {content?.type === 'download' && (
            <DownloadLink href={content.url} download>
              Download File
            </DownloadLink>
          )}
          <button onClick={fetchContent} style={{ marginLeft: 10, padding: '5px 10px' }}>
            Reload
          </button>
        </div>
      </ContentWrapper>
    );
  }

  if (!content && !tableData.html && !htmlContent) {
    return <ContentWrapper>Loading...</ContentWrapper>;
  }

  if (tableData.html) {
    return (
      <ContentWrapper>
        <SheetSelector>
          <Select value={tableData.activeSheet} onChange={handleSheetChange}>
            {Object.keys(tableData.html).map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName}
              </option>
            ))}
          </Select>
        </SheetSelector>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div
            ref={contentRef}
            style={{ padding: 10 }}
            dangerouslySetInnerHTML={{
              __html: `
                <style>
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} table {
                    border-collapse: collapse;
                    width: 100%;
                    font-family: Arial, sans-serif;
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} th,
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                    white-space: normal;
                    overflow-wrap: break-word;
                    min-width: 100px;
                    max-width: 600px;
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} th {
                    background-color: #4a90e2;
                    color: #fff;
                    font-weight: bold;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} tr:nth-child(even) {
                    background-color: #f9f9f9;
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} td[colspan] {
                    background-color: #fff;
                    font-weight: bold;
                    font-size: 14px;
                    line-height: 1.5;
                  }
                </style>
                ${tableData.html[tableData.activeSheet]}
              `,
            }}
          />
        </div>
      </ContentWrapper>
    );
  }

  if (htmlContent) {
    return (
      <ContentWrapper>
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Proxy Content"
          sandbox="allow-scripts allow-same-origin"
        />
      </ContentWrapper>
    );
  }

  if (content?.type === 'pdf') {
    return (
      <ContentWrapper>
        <iframe
          src={content.url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="File Content"
          type="application/pdf"
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

  if (content?.type === 'download') {
    return (
      <ContentWrapper>
        <FallbackMessage>
          {content.message || 'This file type is not directly renderable. Please download to view.'}{' '}
          <DownloadLink href={content.url} download={fileName || 'file'}>
            Download File
          </DownloadLink>.
        </FallbackMessage>
      </ContentWrapper>
    );
  }

  return <ContentWrapper>Unsupported content type</ContentWrapper>;
};

export default ProxyContent;