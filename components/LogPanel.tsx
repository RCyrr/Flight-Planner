import React from 'react';
import type { LogMessage } from '../types';
import { ChevronUpIcon, ChevronDownIcon } from './icons';

interface LogPanelProps {
  messages: LogMessage[];
  isVisible: boolean;
  onToggle: () => void;
  onClear: () => void;
}

const LogPanel: React.FC<LogPanelProps> = ({ messages, isVisible, onToggle, onClear }) => {
  const typeClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-sky-400',
  };

  // When collapsed, the panel translates down by its content height (12rem/192px), leaving only the header visible.
  // The header's height is h-12 (3rem/48px).
  const collapsedTransform = 'translate-y-[calc(100%-3rem)]';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : collapsedTransform}`}>
      <div className="bg-gray-800 border-t-2 border-gray-700 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
        <header
          className="flex items-center justify-between p-3 h-12 cursor-pointer hover:bg-gray-700"
          onClick={onToggle}
        >
          <div className="flex items-center">
            {isVisible ? <ChevronDownIcon /> : <ChevronUpIcon />}
            <h3 className="ml-2 font-semibold text-lg">Logs</h3>
          </div>
          {isVisible && (
            <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="text-sm px-3 py-1 bg-red-600 hover:bg-red-50á00 rounded-md transition-colors"
            >
                Clear Logs
            </button>
          )}
        </header>
        {/* The main content area of the log panel */}
        <div className="h-48 p-4 overflow-y-auto bg-gray-900 font-mono text-sm">
          {messages.length === 0 ? (
            <p className="text-gray-500">No log entries yet.</p>
          ) : (
            <ul>
              {messages.map(log => (
                <li key={log.id} className="mb-2 last:mb-0 animate-fade-in">
                  <span className="text-gray-500 mr-3">{log.timestamp}</span>
                  <span className={`${typeClasses[log.type]} font-bold mr-3`}>[{log.type.toUpperCase()}]</span>
                  <span className="text-gray-300 break-words">{log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogPanel;
