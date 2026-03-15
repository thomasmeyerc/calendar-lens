import { useRef, useState, useCallback } from 'react';

interface UploadScreenProps {
  onFileContent: (content: string) => void;
  onBack: () => void;
  onSampleData: () => void;
}

export function UploadScreen({ onFileContent, onBack, onSampleData }: UploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') onFileContent(content);
    };
    reader.readAsText(file);
  }, [onFileContent]);

  return (
    <div className="upload-screen">
      <div className="upload-container">
        <button className="btn btn-ghost btn-sm back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </button>

        <div className="upload-hero">
          <h2 className="upload-title">Upload your calendar</h2>
          <p className="upload-subtitle">Drop an .ics file to analyze your schedule</p>
        </div>

        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          role="button"
          aria-label="Upload ICS calendar file"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <div className="upload-zone-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <p className="upload-zone-text">Drop your file here or <strong>browse</strong></p>
          <p className="upload-zone-hint">Supports .ics and .csv files</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ics,.csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <div className="upload-actions">
          <button className="btn btn-ghost btn-sm" onClick={onSampleData}>Try with sample data</button>
        </div>

        <div className="upload-formats">
          <span className="format-badge">Google Calendar</span>
          <span className="format-badge">Apple Calendar</span>
          <span className="format-badge">Outlook</span>
        </div>
      </div>
    </div>
  );
}
