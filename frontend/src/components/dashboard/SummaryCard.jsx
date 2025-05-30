import React from 'react';
import './SummaryCard.css';

const SummaryCard = ({ title, value, unit, highlight = false }) => {
  return (
    <div className={`summary-card ${highlight ? 'highlight' : ''}`}>
      <h4 className="summary-title">{title}</h4>
      <p className="summary-value">
        <span className="value">{value}</span>
        {unit && <span className="unit">{unit}</span>}
      </p>
    </div>
  );
};

export default SummaryCard;