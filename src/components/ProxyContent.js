import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const ProxyContent = ({ url, backendUrl }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState({ sheets: {}, activeSheet: null });
  const [htmlContent, setHtmlContent] = useState(null);
  const contentRef = useRef(null);

  const fetchContent = async () => {
    if (!url) {
      setError('No URL or link provided');
      return;
    }
    console.log('Fetching content for URL:', url);
    setContent(null);
    setTableData({ sheets: {}, activeSheet: null });
    setHtmlContent(null);
    setError(null);

    try {
      let response;
      if (url.startsWith('blob:')) {
        response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Blob fetch failed: ${response.status} - ${response.statusText}`);
        const blob = await response.blob();
        await handleContentType(blob.type, blob);
      } else {
        const proxyUrl = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        response = await fetch(proxyUrl, { method: 'GET' });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Proxy fetch failed: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.message && data.url) {
            setContent({
              type: 'download',
              url: data.url,
              message: data.message,
              isExternalLink: true,
            });
            return;
          }
        }

        const blob = await response.blob();
        await handleContentType(response.headers.get('content-type') || 'application/octet-stream', blob);
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
      } else if (url.startsWith('http')) {
        try {
          const blob = await fetch(url, { mode: 'no-cors' }).then((res) => res.blob());
          setContent({ type: 'download', url: URL.createObjectURL(blob) });
        } catch (httpErr) {
          console.error('HTTP fallback error:', httpErr);
        }
      }
    }
  };

  const handleContentType = async (contentType, blob) => {
    const url = URL.createObjectURL(blob);
    if (contentType.includes('application/pdf')) {
      setContent({ type: 'pdf', url });
    } else if (contentType.includes('image/')) {
      setContent({ type: 'image', url });
    } else if (
      contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      contentType.includes('application/vnd.ms-excel')
    ) {
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheets = {};
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: true, defval: '' });
        if (jsonData.length > 0 || Object.keys(worksheet).length > 1) {
          const columns = jsonData[0]?.length > 0 ? jsonData[0].map((header, index) => ({
            key: index.toString(),
            name: header?.toString() || `Column ${index + 1}`,
          })) : [{ key: '0', name: 'Column A' }];
          const rows = jsonData.slice(1).map((row, rowIndex) =>
            columns.reduce((obj, col, colIndex) => {
              obj[col.key] = row[colIndex]?.toString() || '';
              return obj;
            }, {})
          );
          sheets[sheetName] = { columns, rows };
        }
      });
      if (Object.keys(sheets).length === 0) throw new Error('No valid sheets found in the Excel file');
      setTableData({ sheets, activeSheet: Object.keys(sheets)[0] });
    } else if (contentType.includes('text/csv')) {
      const text = await blob.text();
      const result = Papa.parse(text, { header: false, skipEmptyLines: false });
      if (result.data && result.data.length) {
        const columns = result.data[0].map((header, index) => ({
          key: index.toString(),
          name: header?.toString() || `Column ${index + 1}`,
        }));
        const rows = result.data.slice(1).map((row, rowIndex) =>
          columns.reduce((obj, col, colIndex) => {
            obj[col.key] = row[colIndex]?.toString() || '';
            return obj;
          }, {})
        );
        setTableData({ sheets: { 'Sheet1': { columns, rows } }, activeSheet: 'Sheet1' });
      } else {
        throw new Error('No data found in the CSV file');
      }
    } else if (
      contentType.includes('application/msword') ||
      contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
      contentType.includes('text/html')
    ) {
      const text = await blob.text();
      setHtmlContent(text);
    } else if (
      contentType.includes('application/vnd.ms-powerpoint') ||
      contentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    ) {
      setContent({ type: 'download', url, message: 'PPT/PPTX files cannot be rendered directly. Please download to view.' });
    } else {
      setContent({ type: 'download', url, message: 'This file type is not directly renderable. Please download to view.' });
    }
  };

  const handleSheetChange = (e) => {
    setTableData((prev) => ({ ...prev, activeSheet: e.target.value }));
  };

  useEffect(() => {
    fetchContent();
  }, [url]);

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        e.preventDefault();
        const newUrl = link.href;
        window.parent.postMessage({ type: 'linkClick', url: newUrl }, '*');
      }
    };

    const contentElement = contentRef.current;
    if (contentElement && htmlContent) {
      contentElement.addEventListener('click', handleClick);
    }
    return () => {
      if (contentElement && htmlContent) {
        contentElement.removeEventListener('click', handleClick);
      }
    };
  }, [htmlContent]);

  if (error) {
    return (
      <div style={{ color: '#ff4d4f', padding: 12, background: '#ffe6e6', borderRadius: 8, textAlign: 'center', fontSize: 16 }}>
        {error}
        {content?.type === 'download' && (
          <a
            href={content.url}
            download={!content.isExternalLink}
            target={content.isExternalLink ? '_blank' : undefined}
            rel={content.isExternalLink ? 'noopener noreferrer' : undefined}
            style={{ marginLeft: 10, color: '#1a73e8', textDecoration: 'none' }}
          >
            {content.isExternalLink ? 'Open in New Tab' : 'Download File'}
          </a>
        )}
        <button onClick={fetchContent} style={{ marginLeft: 10, padding: '5px 10px' }}>
          Reload
        </button>
      </div>
    );
  }

  if (!content && !tableData.sheets[tableData.activeSheet] && !htmlContent) {
    return <div style={{ color: '#666', padding: 12, textAlign: 'center', fontSize: 16 }}>Loading content, please wait...</div>;
  }

  if (tableData.sheets[tableData.activeSheet]) {
    const { columns, rows } = tableData.sheets[tableData.activeSheet];
    return (
      <div style={{ height: '100%', width: '100%', border: '1px solid #ddd', background: '#fff', overflow: 'auto' }}>
        <div style={{ padding: '10px', textAlign: 'center', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
          <select
            value={tableData.activeSheet}
            onChange={handleSheetChange}
            style={{ padding: '5px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            {Object.keys(tableData.sheets).map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName}
              </option>
            ))}
          </select>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    background: '#4a90e2',
                    color: '#fff',
                    textAlign: 'left',
                    fontWeight: 'bold',
                  }}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ background: rowIndex % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (htmlContent) {
    return (
      <div
        ref={contentRef}
        style={{ padding: 20, overflow: 'auto', maxHeight: '100%' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  if (content?.type === 'pdf') {
    return <embed src={content.url} type="application/pdf" width="100%" height="100%" />;
  }
  if (content?.type === 'image') {
    return <img src={content.url} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '100%' }} />;
  }
  if (content?.type === 'download') {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <p style={{ color: '#666', marginBottom: 10 }}>{content.message || 'This file type is not directly renderable. Please download to view.'}</p>
        <a
          href={content.url}
          download={!content.isExternalLink}
          target={content.isExternalLink ? '_blank' : undefined}
          rel={content.isExternalLink ? 'noopener noreferrer' : undefined}
          style={{ color: '#1a73e8', textDecoration: 'none' }}
        >
          {content.isExternalLink ? 'Open in New Tab' : 'Download File'}
        </a>
      </div>
    );
  }

  return null;
};

export default ProxyContent;