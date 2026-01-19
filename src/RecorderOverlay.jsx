import React from 'react';

/**
 * RecorderOverlay - 스마트 녹화기의 카운트다운 UI 컴포넌트
 */
export const RecorderOverlay = ({ countdown }) => {
  if (countdown === null) return null;

  return (
    <div className="smart-recorder-overlay">
      <div className="countdown-container">
        <div className="glow-effect"></div>
        <div className="countdown-text">
          {countdown}
        </div>
      </div>

      <style jsx>{`
        .smart-recorder-overlay {
          position: absolute;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          background: rgba(0, 0, 0, 0.1);
        }
        .countdown-container {
          position: relative;
        }
        .glow-effect {
          position: absolute;
          inset: 0;
          filter: blur(60px);
          background: rgba(250, 204, 21, 0.2);
          border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }
        .countdown-text {
          font-size: 15rem;
          font-weight: 900;
          color: #facc15;
          text-shadow: 0 0 30px rgba(250, 204, 21, 0.6);
          animation: bounce-short 1s ease-in-out infinite;
        }
        @keyframes bounce-short {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes pulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};
