import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon, ShieldCheck, AlertTriangle, Info, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface TerminalProps {
  logs: LogEntry[];
  isScanning: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, isScanning }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black border border-gray-800 rounded-lg overflow-hidden font-mono text-xs md:text-sm shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2 text-gray-400">
          <TerminalIcon size={16} />
          <span className="font-semibold tracking-wider">SYSTEM LOGS</span>
        </div>
        <div className="flex items-center gap-2">
            {isScanning && (
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
            )}
            <span className={clsx("text-xs", isScanning ? "text-green-500" : "text-gray-500")}>
                {isScanning ? "LIVE CONNECTION ACTIVE" : "IDLE"}
            </span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-2 font-mono"
      >
        {logs.length === 0 && (
            <div className="text-gray-600 italic">Waiting for start command...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-gray-600 min-w-[80px]">{log.timestamp}</span>
            <div className="mt-0.5">
                {log.level === 'INFO' && <Info size={14} className="text-blue-500" />}
                {log.level === 'SUCCESS' && <ShieldCheck size={14} className="text-green-500" />}
                {log.level === 'WARNING' && <AlertTriangle size={14} className="text-yellow-500" />}
                {log.level === 'ERROR' && <XCircle size={14} className="text-red-500" />}
            </div>
            <span className={clsx(
                "break-all",
                log.level === 'INFO' && "text-gray-300",
                log.level === 'SUCCESS' && "text-green-400",
                log.level === 'WARNING' && "text-yellow-400",
                log.level === 'ERROR' && "text-red-400"
            )}>
              {log.message}
            </span>
          </div>
        ))}
        {isScanning && (
            <div className="flex items-center gap-2 text-green-500/50 animate-pulse">
                <span>_</span>
            </div>
        )}
      </div>
    </div>
  );
};
