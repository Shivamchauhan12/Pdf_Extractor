import React from 'react';
import '../Assets/spinner.css'; // Make sure to add this CSS for styling

const SpinnerOverlay = () => {
  return (
    <div className="spinner-overlay">
      <div className="spinner"></div>
    </div>
  );
};

export default SpinnerOverlay;
