/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Cloud, RefreshCw, Copy, Check, Download, Upload, Wifi, WifiOff, ShieldCheck, AlertCircle, Key, Crown } from 'lucide-react';
import { GameState } from '../types/simulator';
import { isOnline, syncToCloud, loadFromCloud, generateCloudSyncPayload, restoreFromCloudSyncPayload } from '../utils/cloudSync';
import { resetGameProgress, saveGameState } from '../utils/storage';
import { sound } from '../utils/audio';

interface CloudSyncModalProps {
  gameState: GameState;
  onUpdateState: (newState: GameState) => void;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  gameState,
  onUpdateState,
  onClose
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [inputSyncToken, setInputSyncToken] = useState<string>('');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportBox, setShowImportBox] = useState<boolean>(false);

  const online = isOnline();

  const handleCloudSyncNow = async () => {
    sound.playClick();
    setIsSyncing(true);
    const res = await syncToCloud(gameState);
    setIsSyncing(false);
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message });
      onUpdateState({ ...gameState, lastSyncedAt: res.lastSyncedAt, offlineQueueCount: 0 });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleCopyToken = () => {
    sound.playClick();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(gameState.cloudSyncToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const handleCopyCrossDeviceLink = () => {
    sound.playClick();
    const payload = generateCloudSyncPayload(gameState);
    const syncUrl = `${window.location.origin}${window.location.pathname}?sync=${encodeURIComponent(payload)}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(syncUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadBackup = () => {
    sound.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gameState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `simuverse_save_${gameState.profile.pilotId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleApplyImport = () => {
    sound.playClick();
    try {
      let restored: GameState | null = null;
      if (importJsonText.trim().startsWith('{')) {
        const parsed = JSON.parse(importJsonText);
        if (parsed.profile && parsed.levelProgress) {
          restored = parsed as GameState;
          saveGameState(restored);
        }
      } else {
        restored = restoreFromCloudSyncPayload(importJsonText.trim(), gameState);
      }

      if (restored) {
        onUpdateState(restored);
        setSyncStatusMsg({ type: 'success', text: 'Save data successfully restored!' });
        setShowImportBox(false);
        setImportJsonText('');
      } else {
        setSyncStatusMsg({ type: 'error', text: 'Invalid save payload or JSON format.' });
      }
    } catch (err) {
      setSyncStatusMsg({ type: 'error', text: 'Failed to import save data: ' + String(err) });
    }
  };

  const handleLoadFromCloudToken = async () => {
    if (!inputSyncToken.trim()) return;
    sound.playClick();
    setIsSyncing(true);
    const res = await loadFromCloud(inputSyncToken.trim(), gameState);
    setIsSyncing(false);
    if (res.success && res.state) {
      onUpdateState(res.state);
      setSyncStatusMsg({ type: 'success', text: res.message });
      setInputSyncToken('');
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress? This will reset all stars and high scores.')) {
      sound.playClick();
      const fresh = resetGameProgress();
      onUpdateState(fresh);
      setSyncStatusMsg({ type: 'info', text: 'Progress reset to initial training status.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-950 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header in Pure Gold & Black */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Cloud className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Cloud Storage & Sync
                </span>
              </h2>
              <p className="text-xs text-amber-200/60">Play offline anywhere and synchronize seamlessly across devices</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-amber-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-amber-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network & Offline Mode Status */}
        <div className="p-4 rounded-xl bg-black border border-amber-500/30 space-y-3 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-amber-200/60">Connection Mode:</span>
            <div className="flex items-center gap-1.5">
              {online ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-bold">ONLINE · CLOUD SYNC READY</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="text-yellow-600 font-bold">OFFLINE MODE ACTIVE</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-amber-200/60">
            <span>Pilot Callsign:</span>
            <span className="text-amber-300 font-bold">{gameState.profile.callsign}</span>
          </div>

          <div className="flex items-center justify-between text-amber-200/60">
            <span>Last Synced:</span>
            <span className="text-amber-100">
              {new Date(gameState.lastSyncedAt).toLocaleTimeString()}
            </span>
          </div>

          {gameState.offlineQueueCount > 0 && (
            <div className="flex items-center gap-2 text-amber-400 text-[11px] pt-1 border-t border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{gameState.offlineQueueCount} local offline scores pending cloud upload.</span>
            </div>
          )}
        </div>

        {syncStatusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-mono border ${
              syncStatusMsg.type === 'success'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/50'
                : syncStatusMsg.type === 'error'
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                : 'bg-neutral-900 text-amber-200 border-amber-900/40'
            }`}
          >
            {syncStatusMsg.text}
          </div>
        )}

        {/* Primary Sync Actions in Pure Gold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleCloudSyncNow}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20"
          >
            <RefreshCw className={`w-4 h-4 text-black ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Cloud Storage Now'}</span>
          </button>

          <button
            onClick={handleCopyCrossDeviceLink}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-amber-200 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 active:scale-[0.98] transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedLink ? 'Copied Sync Link!' : 'Copy Cross-Device Link'}</span>
          </button>
        </div>

        {/* Cloud Token Sharing */}
        <div className="space-y-2 p-3.5 rounded-xl bg-black border border-amber-500/30 text-xs">
          <div className="flex items-center justify-between text-amber-200/60">
            <span className="font-bold text-amber-300">Your Cloud Pilot Token</span>
            <button
              onClick={handleCopyToken}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono font-bold"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="font-mono text-amber-300 bg-neutral-950 px-2.5 py-1.5 rounded-lg truncate border border-amber-500/20 select-all">
            {gameState.cloudSyncToken}
          </div>
        </div>

        {/* Connect Device via Cloud Token */}
        <div className="space-y-2 text-xs">
          <span className="text-amber-300 font-bold">Load Cloud Save from Another Device:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Paste Cloud Pilot Token here..."
              value={inputSyncToken}
              onChange={(e) => setInputSyncToken(e.target.value)}
              className="flex-1 bg-black border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleLoadFromCloudToken}
              disabled={isSyncing || !inputSyncToken.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl disabled:opacity-50 text-xs transition-colors"
            >
              Load
            </button>
          </div>
        </div>

        {/* Export / Import Backup JSON */}
        <div className="space-y-3 pt-3 border-t border-amber-500/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-200/60 font-medium">Backup & Data Portability:</span>
            <button
              onClick={() => setShowImportBox(!showImportBox)}
              className="text-amber-400 hover:text-amber-300 text-xs font-bold"
            >
              {showImportBox ? 'Hide Import' : 'Import Save Code / JSON'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadBackup}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs text-amber-200 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Backup File</span>
            </button>
          </div>

          {showImportBox && (
            <div className="space-y-2 pt-2">
              <textarea
                rows={3}
                placeholder="Paste backup JSON or encoded cloud sync string here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full bg-black border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleApplyImport}
                className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold rounded-xl text-xs transition-colors"
              >
                Apply Import & Overwrite
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-2 flex items-center justify-between border-t border-amber-500/20 text-xs">
          <button
            onClick={handleResetProgress}
            className="text-amber-600 hover:text-amber-500 transition-colors"
          >
            Reset All Game Progress
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 transition-colors font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
