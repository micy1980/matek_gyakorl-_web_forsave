import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import BasicOperations from './components/BasicOperations';
import MultiplicationTable from './components/MultiplicationTable';
import { Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  fontSize: 16,
  theme: 'light',
  aStart: '3',
  aEnd: '9',
  bStart: '3',
  bEnd: '9',
  opName: 'Összeadás',
  taskCount: 5,
  intOnly: false,
  nameMain: '',
  nameMul: '',
  mulTaskCount: 5,
  mulSelected: [],
  mulMaxFor: {},
  mulSequential: false,
};

function App() {
  const [activeTab, setActiveTab] = useState<'basic' | 'multiplication'>('basic');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mathPracticeSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mathPracticeSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden"
      style={{ fontSize: `${settings.fontSize}px` }}
    >
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="mb-4 md:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gyakorló program a matematikai alapműveletekhez
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <button
              onClick={toggleTheme}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              {settings.theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="hidden sm:inline">Éjszakai mód</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="hidden sm:inline">Nappali mód</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-2">
              <label className="text-gray-700 dark:text-gray-300 text-sm md:text-base">Betűméret:</label>
              <input
                type="number"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) || 16 })}
                className="w-14 md:w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center text-sm md:text-base"
              />
            </div>
          </div>
        </header>

        <div className="mb-4 md:mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-2 md:gap-4 overflow-x-auto">
              <button
                onClick={() => {
                  if (timerRunning) {
                    alert('Aktív feladat közben nem válthatsz fület!');
                    return;
                  }
                  setActiveTab('basic');
                }}
                className={`px-4 md:px-6 py-2 md:py-3 font-medium transition-colors whitespace-nowrap text-sm md:text-base ${
                  activeTab === 'basic'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Alapműveletek
              </button>
              <button
                onClick={() => {
                  if (timerRunning) {
                    alert('Aktív feladat közben nem válthatsz fület!');
                    return;
                  }
                  setActiveTab('multiplication');
                }}
                className={`px-4 md:px-6 py-2 md:py-3 font-medium transition-colors whitespace-nowrap text-sm md:text-base ${
                  activeTab === 'multiplication'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Szorzótábla
              </button>
            </nav>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 md:p-6">
          {activeTab === 'basic' ? (
            <BasicOperations
              settings={settings}
              updateSettings={updateSettings}
              timerRunning={timerRunning}
              setTimerRunning={setTimerRunning}
            />
          ) : (
            <MultiplicationTable
              settings={settings}
              updateSettings={updateSettings}
              timerRunning={timerRunning}
              setTimerRunning={setTimerRunning}
            />
          )}
        </div>

        <footer className="mt-6 text-left">
          <p className="text-sm italic text-gray-500 dark:text-gray-400">
            Developed by peterL β v1.00
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
