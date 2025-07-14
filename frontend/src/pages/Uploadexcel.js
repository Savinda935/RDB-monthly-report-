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
  const [statusSummary, setStatusSummary] = useState({});
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const calculateSLA = (dueBy, resolvedDate) => {
    if (!dueBy || !resolvedDate) return '-';

    try {
      const dueDate = new Date(dueBy);
      const resolved = new Date(resolvedDate);

      if (isNaN(dueDate.getTime()) || isNaN(resolved.getTime())) return '-';

      const diffMs = resolved - dueDate;

      if (diffMs < 0) return 'N/A';

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const remainingMinutes = totalMinutes % (60 * 24);
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;

      const dayPart = days > 0 ? `${days} days ` : '';
      const timePart = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hrs`;

      return `delayed by ${dayPart}${timePart}`;
    } catch (e) {
      return '-';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
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

      const processedRows = allRows.map(row => {
        const dueBy = row['DueBy Date'];
        const resolvedDate = row['Resolved Date'];
        return {
          ...row,
          'SLA': calculateSLA(dueBy, resolvedDate),
        };
      });

      const delayedCount = processedRows.filter(row => row['SLA'] && row['SLA'].includes('delayed by')).length;

      const columns = Array.from(new Set(processedRows.flatMap(row => Object.keys(row)))).filter(col => col !== 'DueBy Date' && col !== 'Resolved Date');
      setUploadedColumns(columns);

      const filteredRows = processedRows.map(row => {
        const { 'DueBy Date': _, 'Resolved Date': __, ...rest } = row;
        return rest;
      });
      setUploadedRows(filteredRows);

      const statusCounts = {};
      processedRows.forEach(row => {
        const status = row['Status'] || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      setStatusSummary({ ...statusCounts, 'Delayed By': delayedCount });

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
  const exportPDF = async () => {
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;
    const doc = new jsPDF();

    const toDataURL = url =>
      fetch(url)
        .then(response => response.blob())
        .then(blob =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
        );

    toDataURL(report).then(dataUrl => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

      // Add Month and Year on the first page
      doc.setFontSize(40);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(` ${month || '-'}`, 20, 235);
      doc.text(` ${year || '-'}`, 20, 220);

      doc.addPage();
      doc.setFontSize(22);
      doc.setTextColor('#667eea');
      doc.text('Just Uploaded Data Report', pageWidth / 2, 25, { align: 'center' });
      doc.setDrawColor('#667eea');
      doc.setLineWidth(1.5);
      doc.line(14, 30, pageWidth - 14, 30);

      // Add main table
      autoTable(doc, {
        head: [uploadedColumns],
        body: uploadedRows.map(row => uploadedColumns.map(col => row[col] || '-')),
        startY: 50,
        styles: { fontSize: 10, textColor: '#232946' },
        headStyles: { fillColor: [102, 126, 234], textColor: '#fff', fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 244, 255] },
        tableLineColor: [102, 126, 234],
        tableLineWidth: 0.5,
      });

      // Add Status Summary to PDF
      doc.setFontSize(16);
      doc.setTextColor('#000');
      doc.text('Status Summary:', 14, doc.lastAutoTable.finalY + 15);

      const summaryData = Object.entries(statusSummary).map(([status, count]) => [status, count.toString()]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Status', 'Count']],
        body: summaryData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [102, 126, 234], textColor: '#fff', fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 244, 255] },
        tableLineColor: [102, 126, 234],
        tableLineWidth: 0.5,
      });

      // Add Delayed By Summary
      doc.setFontSize(16);
      doc.setTextColor('#000');
      doc.text('SLA Summary:', 14, doc.lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Metric', 'Count']],
        body: [['Delayed By', statusSummary['Delayed By'].toString()]],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [102, 126, 234], textColor: '#fff', fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 244, 255] },
        tableLineColor: [102, 126, 234],
        tableLineWidth: 0.5,
      });

      doc.save('just_uploaded_report.pdf');
    });
  };

  return (
    <div className="uploadexcel-container">
      <div className="uploadexcel-background">
        <div className="uploadexcel-shape shape1"></div>
        <div className="uploadexcel-shape shape2"></div>
        <div className="uploadexcel-shape shape3"></div>
      </div>

      <div className="uploadexcel-card">
        {/* --- Add Month & Year Selectors --- */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, justifyContent: 'center' }}>
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Month:</label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="">Select Month</option>
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, idx) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Year:</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="">Select Year</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        {/* --- End Month & Year Selectors --- */}

        <div className="uploadexcel-header">
          <div className="uploadexcel-icon">
            {/* SVG icon */}
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
              <div className="uploadexcel-upload-icon"></div>
              <span className="uploadexcel-label-text">
                {files.length > 0 ? `${files.length} file(s) selected` : 'Choose files or drag here'}
              </span>
              <span className="uploadexcel-label-subtext">Supports .xlsx and .xls files</span>
            </label>
          </div>

          {files.length > 0 && (
            <div className="uploadexcel-file-list">
              {Array.from(files).map((file, index) => (
                <div key={index} className="uploadexcel-file-item">
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
                Upload Files
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`uploadexcel-message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {uploadedRows.length > 0 && (
          <div style={{ marginTop: 40, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}>
            <h3 style={{ marginBottom: 16 }}>Just Uploaded Data</h3>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
              <CSVLink
                data={uploadedRows}
                headers={uploadedColumns.map(col => ({ label: col, key: col }))}
                filename="just_uploaded_report.csv"
                className="uploadexcel-btn"
                style={{ textDecoration: 'none' }}
              >
                Export CSV
              </CSVLink>
              <button
                className="uploadexcel-btn"
                onClick={exportPDF}
              >
                Export PDF
              </button>
            </div>

            {/* Table display */}
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

            {/* ✅ UI Status Summary Table */}
            {Object.keys(statusSummary).length > 0 && (
              <div style={{ marginTop: 40 }}>
                <h3>Status Summary</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#667eea', color: '#fff' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(statusSummary).map(([status, count], idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#f3f4f6' : '#fff' }}>
                        <td style={{ padding: '10px' }}>{status}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ✅ UI Delayed By Summary Table */}
            {statusSummary['Delayed By'] > 0 && (
              <div style={{ marginTop: 40 }}>
                <h3>Delayed By Summary</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#667eea', color: '#fff' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Metric</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#f3f4f6' }}>
                      <td style={{ padding: '10px' }}>Delayed By</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{statusSummary['Delayed By']}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Uploadexcel;
