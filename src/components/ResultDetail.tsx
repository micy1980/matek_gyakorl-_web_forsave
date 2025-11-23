import { X } from 'lucide-react';
import { ResultRandom, ResultTTable, formatSeconds } from '../lib/supabase';

interface Props {
  result: ResultRandom | ResultTTable;
  mode: 'random' | 'ttable';
  onClose: () => void;
}

export default function ResultDetail({ result, mode, onClose }: Props) {
  const title = mode === 'random' ? 'Alapműveletek' : 'Szorzótábla';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Eredmények – {title} – {result.name} ({result.run_id})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6 space-y-2 text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-semibold">Azonosító:</span> {result.run_id}
            </div>
            <div>
              <span className="font-semibold">Név:</span> {result.name}
            </div>
            <div>
              <span className="font-semibold">Dátum:</span>{' '}
              {new Date(result.timestamp).toLocaleString('hu-HU')}
            </div>
            <div>
              <span className="font-semibold">Feladatok:</span> {result.tasks}
            </div>
            <div>
              <span className="font-semibold">Helyes:</span> {result.correct}
            </div>
            <div>
              <span className="font-semibold">Idő:</span> {formatSeconds(result.seconds)}
            </div>
          </div>

          {result.tasks_detail && result.tasks_detail.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-sm">
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
                  {result.tasks_detail.map((task, idx) => {
                    const isYellow = task.check === '-' || (task.user === '-' && task.check !== '✓');
                    const isGreen = task.check === '✓';
                    const isRed = task.check === '✗';
                    const bgColor = isYellow ? 'bg-[#FFC000]' : isGreen ? 'bg-green-100 dark:bg-green-900' : isRed ? 'bg-red-100 dark:bg-red-900' : '';
                    return (
                    <tr
                      key={idx}
                      className={`border-t border-gray-200 dark:border-gray-700 ${bgColor} ${
                        task.check === '✓'
                          ? 'text-green-600 dark:text-green-400'
                          : task.check === '✗'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <td className="px-4 py-2 text-center">{idx + 1}</td>
                      <td className="px-4 py-2 text-center">{task.expr}</td>
                      <td className="px-4 py-2 text-center">{task.user}</td>
                      <td className="px-4 py-2 text-center font-bold">{task.check}</td>
                      <td className="px-4 py-2 text-center">{task.correct}</td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              Nincs részletes feladatlista mentve.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
