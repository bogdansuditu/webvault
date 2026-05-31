import React, { useMemo } from 'react';

interface CSVPreviewProps {
  content: string;
}

export const CSVPreview: React.FC<CSVPreviewProps> = ({ content }) => {
  const parsedData = useMemo(() => {
    if (!content) return [];

    const lines = content.split(/\r?\n/);
    const data: string[][] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const row: string[] = [];
      let currentVal = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          // Toggle quote scope
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          // End of column
          row.push(currentVal.trim().replace(/^"(.*)"$/, '$1'));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      // Push last column of row
      row.push(currentVal.trim().replace(/^"(.*)"$/, '$1'));

      if (row.some(cell => cell.length > 0)) {
        data.push(row);
      }
    }

    return data;
  }, [content]);

  if (parsedData.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
        No CSV data found or file is empty.
      </div>
    );
  }

  const headers = parsedData[0];
  const rows = parsedData.slice(1);

  return (
    <div className="csv-preview-container" style={{ width: '100%', overflowX: 'auto', padding: '30px 40px' }}>
      <table 
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          color: 'var(--text-primary)',
          textAlign: 'left',
          background: 'var(--input-bg)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
          border: '1px solid var(--border-inner)'
        }}
      >
        <thead>
          <tr style={{ background: 'var(--sidebar-active)' }}>
            {headers.map((header, idx) => (
              <th 
                key={idx} 
                style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  borderBottom: '2px solid var(--border-inner)',
                  borderRight: idx < headers.length - 1 ? '1px solid var(--border-inner)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {header || `Column ${idx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr 
              key={rowIdx} 
              style={{ 
                background: rowIdx % 2 === 1 ? 'var(--item-hover)' : 'transparent',
                transition: 'background 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--item-selected)'}
              onMouseOut={(e) => e.currentTarget.style.background = rowIdx % 2 === 1 ? 'var(--item-hover)' : 'transparent'}
            >
              {row.map((cell, cellIdx) => (
                <td 
                  key={cellIdx} 
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-inner)',
                    borderRight: cellIdx < row.length - 1 ? '1px solid var(--border-inner)' : 'none',
                    wordBreak: 'break-word',
                    minWidth: '100px'
                  }}
                >
                  {cell}
                </td>
              ))}
              {/* Pad row in case cells are fewer than headers */}
              {row.length < headers.length && 
                Array.from({ length: headers.length - row.length }).map((_, padIdx) => (
                  <td 
                    key={`pad-${padIdx}`} 
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border-inner)',
                      borderRight: (row.length + padIdx) < headers.length - 1 ? '1px solid var(--border-inner)' : 'none'
                    }}
                  />
                ))
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
