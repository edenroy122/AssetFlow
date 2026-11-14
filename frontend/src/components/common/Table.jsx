import React from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import './Table.css';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  className = '',
  compact = false,
  onRowClick = null,
  noScroll = false
}) => {
  return (
    <div className={`ams-table-container ${compact ? 'compact' : ''} ${noScroll ? 'no-scroll' : ''} ${className}`}>
      <div className="ams-table-scroll">
        <table className={`ams-table ${compact ? 'compact' : ''}`}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={col.key || index} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="ams-table-loading">
                    <RefreshCw size={20} className="spin-icon" style={{ color: '#2563eb' }} />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="ams-table-empty">
                    <Inbox size={36} className="ams-table-empty-icon" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row._id || rowIndex}
                  onClick={(event) => {
                    if (!onRowClick || event.target.closest('button, a, input, select, textarea')) return;
                    onRowClick(row, rowIndex, event);
                  }}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key || colIndex}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
