import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import {
  getResultsRandom,
  getResultsTTable,
  ResultRandom,
  ResultTTable,
  formatSeconds,
} from '../lib/supabase';
import ResultDetail from './ResultDetail';

interface Props {
  mode: 'random' | 'ttable';
  onClose: () => void;
}

export default function Dashboard({ mode, onClose }: Props) {
  const [results, setResults] = useState<(ResultRandom | ResultTTable)[]>([]);
  const [nameFilter, setNameFilter] = useState<string>('(Mindegyik)');
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<ResultRandom | ResultTTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [mode]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = mode === 'random' ? await getResultsRandom() : await getResultsTTable();
      setResults(data);

      const names = Array.from(new Set(data.map((r) => r.name).filter(Boolean))).sort();
      setAvailableNames(names);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults =
    nameFilter === '(Mindegyik)'
      ? results
      : results.filter((r) => r.name === nameFilter);

  const totalTasks = filteredResults.reduce((sum, r) => sum + r.tasks, 0);
  const totalCorrect = filteredResults.reduce((sum, r) => sum + r.correct, 0);
  const totalWrong = filteredResults.reduce((sum, r) => {
    const wrong = r.tasks_detail.filter(t => t.check === '✗').length;
    return sum + wrong;
  }, 0);
  const totalUnsolved = filteredResults.reduce((sum, r) => {
    const unsolved = r.tasks_detail.filter(t => t.check === '-').length;
    return sum + unsolved;
  }, 0);
  const totalSeconds = filteredResults.reduce((sum, r) => sum + r.seconds, 0);
  const attempts = filteredResults.length;

  const avgTime = attempts > 0 ? formatSeconds(Math.floor(totalSeconds / attempts)) : '00:00';
  const avgPerTask = totalTasks > 0 ? (totalSeconds / totalTasks).toFixed(2) : '-';

  const handleDeleteAll = async () => {
    const password = prompt('Add meg a jelszót az adatok törléséhez:');
    if (!password) {
      return;
    }

    if (!confirm('Biztosan törölni szeretnéd az összes mentett adatot a Dashboardból?')) {
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-all-results`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Törlési hiba történt.');
        return;
      }

      alert(data.message || 'Az összes mentett adat törlésre került.');
      await loadResults();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Törlési hiba történt.');
    }
  };

  const title = mode === 'random' ? 'Dashboard – Alapműveletek' : 'Dashboard – Szorzótábla';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Név szűrő:
            </label>
            <select
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="(Mindegyik)">(Mindegyik)</option>
              {availableNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              Betöltés...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              Még nincs mentett adat.
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                  {nameFilter !== '(Mindegyik)' ? nameFilter : 'Minden felhasználó'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Próbálkozások:</span> {attempts}
                  </div>
                  <div>
                    <span className="font-medium">Összes feladat:</span> {totalTasks}
                  </div>
                  <div>
                    <span className="font-medium">Helyes:</span> {totalCorrect}
                  </div>
                  <div>
                    <span className="font-medium">Rossz:</span> {totalWrong}
                  </div>
                  <div>
                    <span className="font-medium">Nem megoldott:</span> {totalUnsolved}
                  </div>
                  <div>
                    <span className="font-medium">Összidő:</span> {formatSeconds(totalSeconds)}
                  </div>
                  <div>
                    <span className="font-medium">Átlag idő/próbálkozás:</span> {avgTime}
                  </div>
                  <div>
                    <span className="font-medium">Átlag idő/feladat:</span> {avgPerTask} s
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-center">#</th>
                      <th className="px-4 py-2 text-center">Azonosító</th>
                      <th className="px-4 py-2 text-center">Dátum</th>
                      <th className="px-4 py-2 text-center">Név</th>
                      {mode === 'random' && <th className="px-4 py-2 text-center">Művelet</th>}
                      <th className="px-4 py-2 text-center">Feladatok</th>
                      <th className="px-4 py-2 text-center">Helyes</th>
                      <th className="px-4 py-2 text-center">Rossz</th>
                      <th className="px-4 py-2 text-center">Nem megoldott</th>
                      <th className="px-4 py-2 text-center">Idő</th>
                      <th className="px-4 py-2 text-center">Idő/feladat</th>
                      <th className="px-4 py-2 text-center">Kész?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result, idx) => {
                      const perTask =
                        result.tasks > 0 ? (result.seconds / result.tasks).toFixed(2) : '-';
                      const opName = mode === 'random' ? (result as ResultRandom).op_name : '';
                      const wrong = result.tasks_detail.filter(t => t.check === '✗').length;
                      const unsolved = result.tasks_detail.filter(t => t.check === '-').length;
                      return (
                        <tr
                          key={result.id}
                          onClick={() => setSelectedResult(result)}
                          className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
                        >
                          <td className="px-4 py-2 text-center">{idx + 1}</td>
                          <td className="px-4 py-2 text-center">{result.run_id}</td>
                          <td className="px-4 py-2 text-center">
                            {new Date(result.timestamp).toLocaleString('hu-HU')}
                          </td>
                          <td className="px-4 py-2 text-center">{result.name}</td>
                          {mode === 'random' && <td className="px-4 py-2 text-center">{opName}</td>}
                          <td className="px-4 py-2 text-center">{result.tasks}</td>
                          <td className="px-4 py-2 text-center">{result.correct}</td>
                          <td className="px-4 py-2 text-center">{wrong}</td>
                          <td className="px-4 py-2 text-center">{unsolved}</td>
                          <td className="px-4 py-2 text-center">
                            {formatSeconds(result.seconds)}
                          </td>
                          <td className="px-4 py-2 text-center">{perTask} s</td>
                          <td className="px-4 py-2 text-center">
                            {result.finished ? 'Igen' : 'Nem'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleDeleteAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Összes adat törlése
          </button>
        </div>
      </div>

      {selectedResult && (
        <ResultDetail
          result={selectedResult}
          mode={mode}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
