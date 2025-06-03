import React from 'react';
 
const Image = ({ imageUrl }) => {
  return (
<div style={{ textAlign: 'center', padding: '20px' }}>
<img
        src={imageUrl}
        alt="Large"
        style={{
          maxWidth: '200px',
          height: 'auto',
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}
      />
</div>
  );
};
 
export default Image;