import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Loading = () => {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .loading-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              gap: 10px;
            }
            .custom-spinner {
              color: #5367FF; /* Blue color */
              width: 40px !important;
              height: 40px !important;
            }
            .loading-text {
              font-size: 16px;
              color: #333;
              font-family: Arial, sans-serif;
              position: relative;
            }
            .loading-text::after {
              content: '...';
              display: inline-block;
              width: 1.5em;
              text-align: left;
              animation: dots 1.5s infinite;
            }
            @keyframes dots {
              0% { content: ''; }
              33% { content: '.'; }
              66% { content: '..'; }
              100% { content: '...'; }
            }
          `,
        }}
      />
      <div className="loading-container">
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress className="custom-spinner" />
        </Box>
        <p className="loading-text">Loading</p>
      </div>
    </>
  );
};

export default Loading;