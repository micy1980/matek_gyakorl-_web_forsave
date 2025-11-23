import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Save, BarChart3, HelpCircle, Eye } from 'lucide-react';
import { Settings, Task } from '../types';
import { saveResultRandom, generateRunId, formatSeconds, getAllNames } from '../lib/supabase';
import Dashboard from './Dashboard';
import HelpModal from './HelpModal';

interface Props {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  timerRunning: boolean;
  setTimerRunning: (running: boolean) => void;
}

const MIN_TASKS = 5;
const MAX_TASKS = 50;

const OPERATIONS = {
  'Összeadás': '+',
  'Kivonás': '-',
  'Szorzás': '×',
  'Osztás': '÷',
};

export default function BasicOperations({ settings, updateSettings, timerRunning, setTimerRunning }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [tableLocked, setTableLocked] = useState(false);
  const [allSolutionsShown, setAllSolutionsShown] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  useEffect(() => {
    loadSavedNames();
  }, []);

  const loadSavedNames = async () => {
    try {
      const names = await getAllNames();
      setSavedNames(names);
      setFilteredNames(names);
    } catch (error) {
      console.error('Failed to load names:', error);
    }
  };

  useEffect(() => {
    const count = settings.taskCount;
    if (tasks.length === 0 && count >= MIN_TASKS && count <= MAX_TASKS) {
      generateTasks();
    }
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      setCountdown(null);
      setTimerRunning(true);
      setElapsed(0);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, setTimerRunning]);

  useEffect(() => {
    const input = settings.nameMain.toLowerCase();
    if (!input) {
      setFilteredNames(savedNames);
    } else {
      setFilteredNames(savedNames.filter((n) => n.toLowerCase().includes(input)));
    }
  }, [settings.nameMain, savedNames]);

  const generateTasks = useCallback(() => {
    const count = settings.taskCount;
    let aMin = parseInt(settings.aStart) || 0;
    let aMax = parseInt(settings.aEnd) || 0;
    let bMin = parseInt(settings.bStart) || 0;
    let bMax = parseInt(settings.bEnd) || 0;

    if (aMin > aMax) [aMin, aMax] = [aMax, aMin];
    if (bMin > bMax) [bMin, bMax] = [bMax, bMin];

    const op = OPERATIONS[settings.opName as keyof typeof OPERATIONS];
    const newTasks: Task[] = [];

    for (let i = 0; i < count; i++) {
      let a: number, b: number, result: number;

      if (op === '÷' && settings.intOnly) {
        const bVal = Math.floor(Math.random() * (bMax - bMin + 1)) + bMin;
        if (bVal === 0) {
          i--;
          continue;
        }
        const kMin = Math.ceil(aMin / bVal);
        const kMax = Math.floor(aMax / bVal);
        if (kMin > kMax) {
          i--;
          continue;
        }
        const k = Math.floor(Math.random() * (kMax - kMin + 1)) + kMin;
        a = bVal * k;
        b = bVal;
        result = a / b;
      } else {
        a = Math.floor(Math.random() * (aMax - aMin + 1)) + aMin;
        b = Math.floor(Math.random() * (bMax - bMin + 1)) + bMin;

        if (op === '÷' && b === 0) {
          i--;
          continue;
        }

        switch (op) {
          case '+':
            result = a + b;
            break;
          case '-':
            result = a - b;
            break;
          case '×':
            result = a * b;
            break;
          case '÷':
            result = parseFloat((a / b).toFixed(4));
            break;
          default:
            result = 0;
        }
      }

      newTasks.push({
        id: `task-${i}`,
        expr: `${a} ${op} ${b}`,
        answer: '',
        check: '',
        solution: '',
        correctValue: result,
        viewed: false,
      });
    }

    setTasks(newTasks);
    setElapsed(0);
    setTableLocked(false);
    setAllSolutionsShown(false);
    setTimerRunning(false);
    setSelectedRowId(null);
  }, [settings, setTimerRunning]);

  const handleGenerateTasks = () => {
    if (timerRunning) return;
    if (!confirm('Biztosan új feladatokat szeretnél generálni?')) return;
    generateTasks();
  };

  const isStartEnabled = () => {
    if (tableLocked) return false;
    if (!settings.nameMain.trim()) return false;
    if (!settings.aStart || !settings.aEnd) return false;
    if (!settings.bStart || !settings.bEnd) return false;
    if (tasks.length === 0) return false;
    return true;
  };

  const handleStartTimer = () => {
    if (tableLocked) {
      alert('Mentés után új feladatokat kell generálni a folytatáshoz.');
      return;
    }

    const missing = [];
    if (!settings.nameMain.trim()) missing.push('Név');
    if (!settings.aStart || !settings.aEnd) missing.push('A kezdete és vége');
    if (!settings.bStart || !settings.bEnd) missing.push('B kezdete és vége');
    if (tasks.length === 0) missing.push('Feladatok generálása');

    if (missing.length > 0) {
      alert(`Hiányzó mezők:\n- ${missing.join('\n- ')}`);
      return;
    }
    setCountdown(3);
  };

  const handleAnswerChange = (taskId: string, value: string) => {
    if (tableLocked) return;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        const trimmed = value.trim();
        if (trimmed === '') {
          return { ...task, answer: value, check: '' };
        }

        const userVal = parseFloat(trimmed.replace(',', '.'));
        if (isNaN(userVal)) {
          return { ...task, answer: value, check: '✗' };
        }

        const correct = task.correctValue !== null && Math.abs(userVal - task.correctValue) < 0.0001;
        return { ...task, answer: value, check: correct ? '✓' : '✗' };
      })
    );
  };

  const handleShowSelected = () => {
    if (!selectedRowId) {
      alert('Először kattints egy sorra a táblában.');
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === selectedRowId
          ? { ...task, solution: task.correctValue?.toString() || '', check: task.check || '-', viewed: true }
          : task
      )
    );
  };

  const handleShowAllSolutions = async () => {
    if (tasks.length === 0) {
      alert('Előbb generálj feladatokat.');
      return;
    }

    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        solution: task.correctValue?.toString() || '',
        check: task.answer.trim() ? task.check : '-',
        viewed: true
      }))
    );
    setAllSolutionsShown(true);
    setTimerRunning(false);
    await performSave();
  };

  const performSave = async () => {
    const name = settings.nameMain.trim();
    if (!name) {
      alert('Add meg a neved a mentéshez.');
      return;
    }

    const correctCount = tasks.filter((t) => t.check === '✓').length;
    const runId = generateRunId();

    const tasksDetail = tasks.map((t) => ({
      expr: t.expr,
      user: t.answer || '-',
      check: t.check || '-',
      correct: t.correctValue || 0,
    }));

    try {
      await saveResultRandom({
        run_id: runId,
        name,
        tasks: tasks.length,
        correct: correctCount,
        seconds: elapsed,
        finished: correctCount === tasks.length,
        timestamp: new Date().toISOString(),
        op_name: settings.opName,
        a_start: settings.aStart,
        a_end: settings.aEnd,
        b_start: settings.bStart,
        b_end: settings.bEnd,
        int_only: settings.intOnly,
        tasks_detail: tasksDetail,
      });

      setTasks((prev) =>
        prev.map((task) => ({
          ...task,
          solution: task.correctValue?.toString() || '',
        }))
      );

      alert(
        `Mentve!\n\nAzonosító: ${runId}\nNév: ${name}\nFeladatok: ${tasks.length}\nHelyes: ${correctCount}\nIdő: ${formatSeconds(elapsed)}`
      );

      setTableLocked(true);
      setTimerRunning(false);
      loadSavedNames();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Mentési hiba történt.');
    }
  };

  const canSave =
    tasks.length > 0 &&
    !tableLocked &&
    settings.nameMain.trim() !== '' &&
    tasks.every((t) => t.answer.trim() !== '' || t.viewed);

  const handleSave = async () => {
    if (!canSave) {
      alert('Töltsd ki a név mezőt és minden feladatot a mentéshez!');
      return;
    }
    await performSave();
  };

  return (
    <>
      {countdown !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-9xl font-bold text-yellow-500 animate-pulse">
            {countdown}
          </div>
        </div>
      )}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 overflow-hidden">
        <div className="mb-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Idő: {formatSeconds(elapsed)}
          </div>
        </div>

        <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <table className="w-full" style={{ fontSize: `${settings.fontSize}px` }}>
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-center">#</th>
                <th className="px-4 py-2 text-center">Művelet</th>
                <th className="px-4 py-2 text-center">Megoldás</th>
                <th className="px-4 py-2 text-center">Ellenőrzés</th>
                <th className="px-4 py-2 text-center">Eredmény</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => {
                const isSelected = selectedRowId === task.id;
                const isYellow = task.solution !== '' && !task.answer.trim();
                const isGreen = task.check === '✓';
                const isRed = task.check === '✗';
                const bgColor = isSelected ? 'bg-blue-100 dark:bg-blue-900' : isYellow ? 'bg-[#FFC000]' : isGreen ? 'bg-green-100 dark:bg-green-900' : isRed ? 'bg-red-100 dark:bg-red-900' : '';
                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedRowId(task.id)}
                    className={`border-t border-gray-200 dark:border-gray-700 cursor-pointer ${bgColor} ${
                      task.check === '✓'
                        ? 'text-green-600 dark:text-green-400'
                        : task.check === '✗'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-gray-100'
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <td className="px-4 py-2 text-center">{idx + 1}</td>
                    <td className="px-4 py-2 text-center">{task.expr}</td>
                    <td className="px-4 py-2 text-center">
                      <input
                        id={`answer-${task.id}`}
                        type="text"
                        value={task.answer}
                        onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                        onFocus={() => setSelectedRowId(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.shiftKey) {
                              if (idx > 0) {
                                const prevInput = document.getElementById(`answer-${tasks[idx - 1].id}`);
                                prevInput?.focus();
                              }
                            } else {
                              if (idx < tasks.length - 1) {
                                const nextInput = document.getElementById(`answer-${tasks[idx + 1].id}`);
                                nextInput?.focus();
                              }
                            }
                          }
                        }}
                        disabled={tableLocked || timerRunning === false || task.viewed}
                        className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </td>
                    <td className="px-4 py-2 text-center font-bold">{task.check}</td>
                    <td className="px-4 py-2 text-center">{task.solution}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Név
          </label>
          <input
            type="text"
            value={settings.nameMain}
            onChange={(e) => {
              const val = e.target.value;
              updateSettings({ nameMain: val });
              if (val.trim()) {
                const filtered = savedNames.filter(n => n.toLowerCase().includes(val.toLowerCase()));
                setFilteredNames(filtered);
                setShowNameDropdown(filtered.length > 0);
              } else {
                setFilteredNames(savedNames);
                setShowNameDropdown(savedNames.length > 0);
              }
            }}
            onFocus={() => {
              setFilteredNames(savedNames);
              setShowNameDropdown(savedNames.length > 0);
            }}
            onBlur={() => setTimeout(() => setShowNameDropdown(false), 200)}
            disabled={timerRunning}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          />
          {showNameDropdown && filteredNames.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto">
              {filteredNames.map((name) => (
                <div
                  key={name}
                  onClick={() => {
                    updateSettings({ nameMain: name });
                    setShowNameDropdown(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">A kezdete</label>
            <input
              type="number"
              value={settings.aStart}
              onChange={(e) => updateSettings({ aStart: e.target.value })}
              disabled={timerRunning}
              placeholder="kezd"
              className="w-full px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">A vége</label>
            <input
              type="number"
              value={settings.aEnd}
              onChange={(e) => updateSettings({ aEnd: e.target.value })}
              disabled={timerRunning}
              placeholder="vége"
              className="w-full px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">B kezdete</label>
            <input
              type="number"
              value={settings.bStart}
              onChange={(e) => updateSettings({ bStart: e.target.value })}
              disabled={timerRunning}
              placeholder="kezd"
              className="w-full px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">B vége</label>
            <input
              type="number"
              value={settings.bEnd}
              onChange={(e) => updateSettings({ bEnd: e.target.value })}
              disabled={timerRunning}
              placeholder="vége"
              className="w-full px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Művelet
          </label>
          <select
            value={settings.opName}
            onChange={(e) => updateSettings({ opName: e.target.value })}
            disabled={timerRunning}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          >
            {Object.keys(OPERATIONS).map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Feladat darabszám
          </label>
          <select
            value={settings.taskCount}
            onChange={(e) => updateSettings({ taskCount: parseInt(e.target.value) })}
            disabled={timerRunning}
            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center disabled:bg-gray-100 dark:disabled:bg-gray-800"
          >
            {Array.from({ length: MAX_TASKS - MIN_TASKS + 1 }, (_, i) => MIN_TASKS + i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="int-only"
            checked={settings.intOnly}
            onChange={(e) => updateSettings({ intOnly: e.target.checked })}
            disabled={timerRunning}
            className="mr-2"
          />
          <label htmlFor="int-only" className="text-sm text-gray-700 dark:text-gray-300">
            Eredmény csak egész szám (osztásnál)
          </label>
        </div>

        <button
          onClick={handleGenerateTasks}
          disabled={timerRunning}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Feladatok generálása
        </button>

        <button
          onClick={handleShowSelected}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Mutasd az aktuális sor megoldását
        </button>

        <button
          onClick={handleShowAllSolutions}
          disabled={allSolutionsShown}
          className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4" />
          Mutasd az összes megoldást
        </button>

        <button
          onClick={() => setShowDashboard(true)}
          disabled={timerRunning}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Leírás
        </button>

        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              canSave
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Mentés
          </button>

          <button
            onClick={handleStartTimer}
            disabled={countdown !== null || tableLocked || timerRunning}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              timerRunning
                ? 'bg-green-600'
                : isStartEnabled()
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-400'
            } text-white disabled:cursor-not-allowed`}
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        </div>
      </div>

      {showDashboard && <Dashboard mode="random" onClose={() => setShowDashboard(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
    </>
  );
}
