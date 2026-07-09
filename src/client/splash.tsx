import './styles/index.css';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { context, requestExpandedMode } from '@devvit/web/client';

const Splash = () => {
  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    requestExpandedMode(e.nativeEvent, 'game');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5c371d',
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        padding: '24px',
        boxSizing: 'border-box',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      {/* Coffee cup icon */}
      <div style={{ fontSize: '3rem', lineHeight: 1 }}>☕</div>

      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1
          style={{
            color: '#fdfaf2',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '0.03em',
          }}
        >
          The Last Cafe on the Internet
        </h1>
        {context.username && (
          <p
            style={{
              color: '#c8a285',
              fontSize: '0.75rem',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            Welcome back, {context.username} ☕
          </p>
        )}
      </div>

      {/* Tagline */}
      <p
        style={{
          color: '#eeded1',
          fontSize: '0.75rem',
          maxWidth: '240px',
          lineHeight: 1.6,
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        A quiet corner where strangers leave something real for one another.
      </p>

      {/* Enter button */}
      <button
        onClick={handleEnter}
        style={{
          backgroundColor: '#cf7929',
          color: '#fdfaf2',
          border: '2px solid #2c160a',
          borderRadius: '4px',
          padding: '10px 28px',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '3px 3px 0px #2c160a',
          letterSpacing: '0.05em',
          marginTop: '8px',
          transition: 'background-color 0.15s',
        }}
      >
        Step Inside →
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
