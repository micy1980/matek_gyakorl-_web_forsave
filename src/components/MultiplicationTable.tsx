import { useState, useEffect, useCallback } from 'react';
import { Play, Save, BarChart3, HelpCircle, Eye } from 'lucide-react';
import { Settings, Task } from '../types';
import { saveResultTTable, generateRunId, formatSeconds, getAllNames } from '../lib/supabase';
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
const MAX_TABLE_BASE = 15;
const MAX_TABLE_MULT = 30;

export default function MultiplicationTable({ settings, updateSettings, timerRunning, setTimerRunning }: Props) {
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
    const input = settings.nameMul.toLowerCase();
    if (!input) {
      setFilteredNames(savedNames);
    } else {
      setFilteredNames(savedNames.filter((n) => n.toLowerCase().includes(input)));
    }
  }, [settings.nameMul, savedNames]);

  const generateTasks = useCallback(() => {
    const selected = settings.mulSelected;
    if (selected.length === 0) {
      return;
    }

    const count = settings.mulTaskCount;
    const newTasks: Task[] = [];

    if (settings.mulSequential) {
      // Sequential ordering: generate ALL tasks for selected tables (ignore count)
      let taskIndex = 0;

      for (const base of selected) {
        const maxN = parseInt(settings.mulMaxFor[base.toString()] || '10');
        for (let n = 1; n <= maxN; n++) {
          const result = base * n;

          newTasks.push({
            id: `task-${taskIndex}`,
            expr: `${base} × ${n}`,
            answer: '',
            check: '',
            solution: '',
            correctValue: result,
            viewed: false,
          });

          taskIndex++;
        }
      }
    } else {
      // Random ordering with variety - avoid immediate repeats
      const usedExpressions = new Set<string>();
      let attempts = 0;
      const maxAttempts = count * 50;

      while (newTasks.length < count && attempts < maxAttempts) {
        const base = selected[Math.floor(Math.random() * selected.length)];
        const maxN = parseInt(settings.mulMaxFor[base.toString()] || '10');
        const n = Math.floor(Math.random() * maxN) + 1;
        const expr = `${base} × ${n}`;

        // Skip if we already have this exact expression
        if (usedExpressions.has(expr)) {
          attempts++;
          continue;
        }

        const result = base * n;
        usedExpressions.add(expr);

        newTasks.push({
          id: `task-${newTasks.length}`,
          expr,
          answer: '',
          check: '',
          solution: '',
          correctValue: result,
          viewed: false,
        });

        attempts++;
      }
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
    if (settings.mulSelected.length === 0) {
      alert('Legalább egy szorzótáblát ki kell választani.');
      return;
    }
    if (!confirm('Biztosan új szorzótábla feladatokat szeretnél generálni?')) return;
    generateTasks();
  };

  const isStartEnabled = () => {
    if (tableLocked) return false;
    if (!settings.nameMul.trim()) return false;
    if (settings.mulSelected.length === 0) return false;
    if (tasks.length === 0) return false;
    return true;
  };

  const handleStartTimer = () => {
    if (tableLocked) {
      alert('Mentés után új feladatokat kell generálni a folytatáshoz.');
      return;
    }

    const missing = [];
    if (!settings.nameMul.trim()) missing.push('Név');
    if (settings.mulSelected.length === 0) missing.push('Legalább egy szorzótábla kiválasztása');
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

  const handleTableCheck = (base: number) => {
    if (timerRunning) return;
    const current = settings.mulSelected.includes(base);
    if (current) {
      updateSettings({ mulSelected: settings.mulSelected.filter((b) => b !== base) });
    } else {
      updateSettings({ mulSelected: [...settings.mulSelected, base] });
    }
  };

  const handleTableMaxChange = (base: number, max: string) => {
    if (timerRunning) return;
    updateSettings({
      mulMaxFor: { ...settings.mulMaxFor, [base.toString()]: max },
    });
  };

  const handleClearSelection = () => {
    if (timerRunning) return;
    updateSettings({ mulSelected: [] });
  };

  const performSave = async () => {
    const name = settings.nameMul.trim();
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
      await saveResultTTable({
        run_id: runId,
        name,
        tasks: tasks.length,
        correct: correctCount,
        seconds: elapsed,
        finished: correctCount === tasks.length,
        timestamp: new Date().toISOString(),
        bases: settings.mulSelected,
        max_for: settings.mulMaxFor,
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
    settings.nameMul.trim() !== '' &&
    tasks.every((t) => t.answer.trim() !== '' || t.viewed);

  const handleSave = async () => {
    if (!canSave) {
      alert('Töltsd ki a név mezőt és minden feladatot a mentéshez!');
      return;
    }
    await performSave();
  };

  const renderTableSelector = () => {
    const groups = [];
    for (let i = 0; i < 3; i++) {
      const bases = [];
      for (let j = 1; j <= 5; j++) {
        const base = i * 5 + j;
        if (base > MAX_TABLE_BASE) break;
        bases.push(base);
      }
      groups.push(bases);
    }

    return (
      <div className="grid grid-cols-3 gap-4">
        {groups.map((bases, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {bases.map((base) => (
              <div key={base} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`table-${base}`}
                  checked={settings.mulSelected.includes(base)}
                  onChange={() => handleTableCheck(base)}
                  disabled={timerRunning}
                  className="mr-1"
                />
                <label htmlFor={`table-${base}`} className="text-sm w-6 text-gray-900 dark:text-gray-100">
                  {base}
                </label>
                <select
                  value={settings.mulMaxFor[base.toString()] || '10'}
                  onChange={(e) => handleTableMaxChange(base, e.target.value)}
                  disabled={timerRunning}
                  className="text-sm px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Array.from({ length: MAX_TABLE_MULT }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="mb-4 text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Idő: {formatSeconds(elapsed)}
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
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
                        id={`answer-mul-${task.id}`}
                        type="text"
                        value={task.answer}
                        onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                        onFocus={() => setSelectedRowId(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.shiftKey) {
                              if (idx > 0) {
                                const prevInput = document.getElementById(`answer-mul-${tasks[idx - 1].id}`);
                                prevInput?.focus();
                              }
                            } else {
                              if (idx < tasks.length - 1) {
                                const nextInput = document.getElementById(`answer-mul-${tasks[idx + 1].id}`);
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

      <div className="space-y-2">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Név
          </label>
          <input
            type="text"
            value={settings.nameMul}
            onChange={(e) => {
              const val = e.target.value;
              updateSettings({ nameMul: val });
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
                    updateSettings({ nameMul: name });
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Szorzótábla beállítások (1–{MAX_TABLE_BASE})
          </label>
          <div className="max-h-64 overflow-y-auto p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900">
            {renderTableSelector()}
          </div>
          <button
            onClick={handleClearSelection}
            disabled={timerRunning}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400"
          >
            Kiválasztás törlése
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Feladat darabszám
          </label>
          <select
            value={settings.mulTaskCount}
            onChange={(e) => updateSettings({ mulTaskCount: parseInt(e.target.value) })}
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

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mulSequential"
              checked={settings.mulSequential}
              onChange={(e) => updateSettings({ mulSequential: e.target.checked })}
              disabled={timerRunning}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mulSequential" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Szorzótábla növekvő sorrendben
            </label>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
            Bekapcsolt állapotban: teljes szorzótábla generálása 1-től a kiválasztott maximumig, random helyett. A feladat darabszám ekkor nem számít.
          </p>
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

      {showDashboard && <Dashboard mode="ttable" onClose={() => setShowDashboard(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
    </>
  );
}
