// Uploadexcel.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './Uploadexcel.css';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import report from '../images/report.png';

function Uploadexcel() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedColumns, setUploadedColumns] = useState([]);
  const [uploadedRows, setUploadedRows] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Parse Excel files on the frontend
      let allRows = [];
      for (let file of files) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          allRows = allRows.concat(json);
        });
      }
      // Get all unique columns
      const columns = Array.from(new Set(allRows.flatMap(row => Object.keys(row))));
      setUploadedColumns(columns);
      setUploadedRows(allRows);
      setMessage('Upload successful!');
    } catch (err) {
      setMessage('Upload failed.');
    }
    setLoading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="uploadexcel-container">
      <div className="uploadexcel-background">
        <div className="uploadexcel-shape shape1"></div>
        <div className="uploadexcel-shape shape2"></div>
        <div className="uploadexcel-shape shape3"></div>
      </div>
      
      <div className="uploadexcel-card">
        <div className="uploadexcel-header">
          <div className="uploadexcel-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Upload Excel Files</h2>
          <p>Drag and drop your Excel files here or click to browse</p>
        </div>

        <form onSubmit={handleSubmit} className="uploadexcel-form">
          <div 
            className={`uploadexcel-dropzone ${dragActive ? 'active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              className="uploadexcel-input" 
              type="file" 
              accept=".xlsx,.xls" 
              multiple 
              onChange={handleFileChange}
              id="file-input"
            />
            <label htmlFor="file-input" className="uploadexcel-label">
              <div className="uploadexcel-upload-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="uploadexcel-label-text">
                {files.length > 0 ? `${files.length} file(s) selected` : 'Choose files or drag here'}
              </span>
              <span className="uploadexcel-label-subtext">
                Supports .xlsx and .xls files
              </span>
            </label>
          </div>

          {files.length > 0 && (
            <div className="uploadexcel-file-list">
              {Array.from(files).map((file, index) => (
                <div key={index} className="uploadexcel-file-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="uploadexcel-file-name">{file.name}</span>
                  <span className="uploadexcel-file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}

          <button className="uploadexcel-btn" type="submit" disabled={loading || files.length === 0}>
            {loading ? (
              <>
                <div className="uploadexcel-spinner"></div>
                Uploading...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload Files
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`uploadexcel-message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message.includes('successful') ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
            {message}
          </div>
        )}

        {/* Show uploaded data table if available */}
        {uploadedRows.length > 0 && (
          <div style={{ marginTop: 40, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}>
            <h3 style={{ marginBottom: 16 }}>Just Uploaded Data</h3>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
              {/* CSV Export */}
              <CSVLink
                data={uploadedRows}
                headers={uploadedColumns.map(col => ({ label: col, key: col }))}
                filename="just_uploaded_report.csv"
                className="uploadexcel-btn"
                style={{ textDecoration: 'none' }}
              >
                Export CSV
              </CSVLink>
              {/* PDF Export */}
              <button
                className="uploadexcel-btn"
                onClick={async () => {
                  const jsPDFModule = await import('jspdf');
                  const autoTableModule = await import('jspdf-autotable');
                  const jsPDF = jsPDFModule.default;
                  const autoTable = autoTableModule.default;
                  const doc = new jsPDF();

                  // Convert imported image to base64 data URL
                  const toDataURL = url =>
                    fetch(url)
                      .then(response => response.blob())
                      .then(
                        blob =>
                          new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                          })
                      );

                  toDataURL(report).then(dataUrl => {
                    // Get page size
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    // Add the image as a full-page cover
                    doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

                    // Add a new page for the table and header
                    doc.addPage();

                    // Add a custom header below the image
                    doc.setFontSize(22);
                    doc.setTextColor('#667eea');
                    doc.text('Just Uploaded Data Report', pageWidth / 2, 25, { align: 'center' });

                    // Add a colored line under the header
                    doc.setDrawColor('#667eea');
                    doc.setLineWidth(1.5);
                    doc.line(14, 30, pageWidth - 14, 30);

                    // Add the table
                    autoTable(doc, {
                      head: [uploadedColumns],
                      body: uploadedRows.map(row => uploadedColumns.map(col => row[col] || '-')),
                      startY: 35,
                      styles: { fontSize: 10, textColor: '#232946' },
                      headStyles: { fillColor: [102, 126, 234], textColor: '#fff', fontStyle: 'bold' },
                      alternateRowStyles: { fillColor: [240, 244, 255] },
                      tableLineColor: [102, 126, 234],
                      tableLineWidth: 0.5,
                    });

                    doc.save('just_uploaded_report.pdf');
                  });
                }}
              >
                Export PDF
              </button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <table className="uploadexcel-table" style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                <thead>
                  <tr>
                    {uploadedColumns.map(col => (
                      <th key={col} className="uploadexcel-th">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadedRows.map((row, idx) => (
                    <tr key={idx}>
                      {uploadedColumns.map(col => (
                        <td key={col}>{row[col] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Uploadexcel;