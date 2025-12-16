import React, { useState, useEffect } from 'react';
import { Search, Play, Download, Settings, Database, Server, Cpu, Mail, Bell } from 'lucide-react';
import { Terminal } from './components/Terminal';
import { GrantCard } from './components/GrantCard';
import { Grant, LogEntry, SearchConfig } from './types';
import { discoverGrants } from './services/gemini';
import { sendNotification } from './services/notification';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [config, setConfig] = useState<SearchConfig>({
    keywords: ['grant application', 'call for proposals', 'research funding', 'tech innovation grant'],
    year: new Date().getFullYear(),
    emailRecipient: '',
    notificationEnabled: false
  });
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  // Initial welcome log
  useEffect(() => {
    addLog('System initialized. Ready for discovery run.', 'INFO');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addLog = (message: string, level: LogEntry['level'] = 'INFO') => {
    const entry = {
      id: uuidv4(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    setLogs(prev => [...prev, entry]);
    return entry; // Return for immediate use if needed
  };

  const handleRunDiscovery = async () => {
    if (!process.env.API_KEY) {
        addLog('ERROR: API Key is missing. Please set process.env.API_KEY.', 'ERROR');
        alert("API Key missing! This app requires a Gemini API Key in the environment.");
        return;
    }

    if (isScanning) return;
    setIsScanning(true);
    setLogs([]); // Clear previous run logs
    addLog('Starting new discovery sequence...', 'INFO');

    try {
      // 1. Discovery Phase
      const results = await discoverGrants(config, (log) => {
        setLogs(prev => [...prev, log]);
      });
      
      // 2. Deduplication Phase
      let newGrants: Grant[] = [];
      setGrants(prev => {
        const existingTitles = new Set(prev.map(g => g.program_title.toLowerCase()));
        const uniqueResults = results.filter(g => !existingTitles.has(g.program_title.toLowerCase()));
        newGrants = uniqueResults;
        
        if (uniqueResults.length < results.length) {
            addLog(`Filtered ${results.length - uniqueResults.length} duplicates.`, 'WARNING');
        }
        return [...uniqueResults, ...prev];
      });

      // 3. Notification Phase
      if (newGrants.length > 0 && config.notificationEnabled && config.emailRecipient) {
        await sendNotification(config.emailRecipient, newGrants, (log) => {
             setLogs(prev => [...prev, log]);
        });
      } else if (newGrants.length > 0 && (!config.notificationEnabled || !config.emailRecipient)) {
        addLog('Skipping email notification (Disabled or no recipient).', 'INFO');
      }

    } catch (error) {
      console.error(error);
      addLog('Discovery sequence aborted due to critical error.', 'ERROR');
    } finally {
      setIsScanning(false);
      addLog('Sequence finalized. System Idle.', 'INFO');
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
        setConfig(prev => ({...prev, keywords: [...prev.keywords, newKeyword.trim()]}));
        setNewKeyword('');
    }
  };

  const removeKeyword = (k: string) => {
    setConfig(prev => ({...prev, keywords: prev.keywords.filter(kw => kw !== k)}));
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(grants, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "grants_discovery_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addLog('Data exported to JSON.', 'SUCCESS');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR / CONTROL PANEL */}
      <aside className="w-full md:w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-screen md:sticky md:top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-blue-600 p-2 rounded-lg">
                <Database className="text-white" size={24} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Grant_Crawler</h1>
                <p className="text-xs text-gray-500 font-mono">A product by Innovation</p>
             </div>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Status Panel */}
          <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
             <h2 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <Cpu size={14} /> Engine Status
             </h2>
             <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Model</span>
                    <span className="text-blue-400 font-mono">Gemini 2.5</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Tools</span>
                    <span className="text-green-400 font-mono">Google Search</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Grants Found</span>
                    <span className="text-white font-mono text-lg">{grants.length}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Notifications</span>
                    <span className={config.notificationEnabled ? "text-green-400 font-mono" : "text-gray-500 font-mono"}>
                        {config.notificationEnabled ? "ON" : "OFF"}
                    </span>
                </div>
             </div>
          </div>

          {/* Config Panel */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <Settings size={14} /> Search Config
            </h2>
            
            <div className="space-y-3">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                        placeholder="Add keyword..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                    />
                    <button 
                        onClick={handleAddKeyword}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded border border-gray-700"
                    >
                        +
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {config.keywords.map(k => (
                        <span key={k} className="bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded border border-gray-700 flex items-center gap-1 group">
                            {k}
                            <button onClick={() => removeKeyword(k)} className="text-gray-500 hover:text-red-400">×</button>
                        </span>
                    ))}
                </div>
            </div>
          </div>

          {/* Notification Config */}
          <div>
             <h2 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <Bell size={14} /> Notifications
            </h2>
            <div className="space-y-3 bg-gray-950 p-3 rounded border border-gray-800">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="notify" 
                        checked={config.notificationEnabled}
                        onChange={(e) => setConfig(prev => ({...prev, notificationEnabled: e.target.checked}))}
                        className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="notify" className="text-sm text-gray-300">Email Alerts</label>
                </div>
                {config.notificationEnabled && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-2">
                            <Mail size={14} className="text-gray-500" />
                            <input 
                                type="email" 
                                value={config.emailRecipient}
                                onChange={(e) => setConfig(prev => ({...prev, emailRecipient: e.target.value}))}
                                placeholder="name@example.com"
                                className="w-full bg-transparent py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900/50">
            <button
                onClick={handleRunDiscovery}
                disabled={isScanning}
                className={`w-full py-4 rounded-lg font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                    isScanning 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }`}
            >
                {isScanning ? (
                    <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-white"></span>
                        Scanning...
                    </>
                ) : (
                    <>
                        <Play size={16} fill="currentColor" />
                        Initiate Discovery
                    </>
                )}
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-6 shrink-0">
            <h2 className="font-semibold text-gray-200">Live Dashboard</h2>
            <div className="flex items-center gap-4">
                <button 
                    onClick={downloadJson}
                    disabled={grants.length === 0}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Download size={16} />
                    Export JSON
                </button>
                <div className="h-4 w-px bg-gray-800"></div>
                <div className="flex items-center gap-2 text-xs text-green-500 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50">
                    <Server size={12} />
                    <span>Connected</span>
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Log Terminal Area */}
            <div className="w-full md:w-1/3 p-4 border-r border-gray-800 bg-black/40 h-1/2 md:h-full flex flex-col">
                <Terminal logs={logs} isScanning={isScanning} />
            </div>

            {/* Results Grid Area */}
            <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-gray-950">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Search className="text-blue-500" size={20} />
                            Discovery Results
                        </h3>
                        <span className="text-sm text-gray-500">
                            Showing {grants.length} items
                        </span>
                    </div>

                    {grants.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-800 rounded-xl p-12 text-center">
                            <div className="bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={24} className="text-gray-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-300 mb-2">No Grants Found Yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Configure your keywords in the sidebar and click "Initiate Discovery" to start the AI crawler.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {grants.map(grant => (
                                <GrantCard key={grant.id} grant={grant} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}