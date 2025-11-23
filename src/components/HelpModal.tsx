import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leírás</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto text-gray-700 dark:text-gray-300 space-y-4">
          <p>A program két fülből áll, ahol matematikai alapműveleteket és szorzótáblát gyakorolhatsz.</p>

          <div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
              1) Alapműveletek fül
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Név:</strong> Add meg a nevedet (kötelező a start és mentés előtt). A rendszer automatikusan javasolja a korábban használt neveket.
              </li>
              <li>
                <strong>Tartományok:</strong> Állítsd be az "A" és "B" számok kezdő és végértékét.
              </li>
              <li>
                <strong>Művelet:</strong> Válassz az Összeadás, Kivonás, Szorzás vagy Osztás közül. Az Osztásnál bekapcsolhatod, hogy csak egész eredmények legyenek.
              </li>
              <li>
                <strong>Feladat darabszám:</strong> 5-50 közötti érték állítható be (alapértelmezetten 5).
              </li>
              <li>
                <strong>Feladatok generálása:</strong> Új véletlen feladatok készítése a beállított tartományok alapján.
              </li>
              <li>
                <strong>Start gomb:</strong> 3 másodperces visszaszámlálás után elindul az időmérés és a megoldó mezők aktiválódnak. A Start csak akkor nyomható meg, ha minden kötelező mező ki van töltve és új feladatok vannak generálva.
              </li>
              <li>
                <strong>Megoldás:</strong> Írd be a válaszaidat a megoldás oszlopba. Automatikus ellenőrzés: zöld ✓ = helyes, piros ✗ = hibás.
              </li>
              <li>
                <strong>Sor színezés:</strong> A feladat futása közben vagy mentés után a sorok színes hátteret kapnak: zöld = helyes válasz, piros = hibás válasz, sárga = megnézett eredmény (amikor nem írtál be választ).
              </li>
              <li>
                <strong>Aktuális sor megoldása:</strong> Kattints egy sorra, majd nyomd meg ezt a gombot a helyes eredmény megjelenítéséhez az "Eredmény" oszlopban.
              </li>
              <li>
                <strong>Összes megoldás:</strong> Ez a gomb megjeleníti az összes helyes eredményt, leállítja az időt és automatikusan elmenti az eredményt.
              </li>
              <li>
                <strong>Mentés:</strong> Csak akkor aktív, ha a név ki van töltve és minden feladat meg van válaszolva. Mentés után a tábla zárolódik és új feladatokat kell generálni a folytatáshoz.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
              2) Szorzótábla fül
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Név:</strong> Add meg a nevedet (kötelező).
              </li>
              <li>
                <strong>Szorzótábla kiválasztás:</strong> 15 szorzótábla közül választhatsz (1-15). Minden szám mellett állíthatod, meddig menjen a szorzás (1-30).
              </li>
              <li>
                <strong>Feladat darabszám:</strong> 5-50 közötti érték (alapértelmezetten 5).
              </li>
              <li>
                A többi funkció (Start, megoldás, mentés, színezés, időmérés) ugyanúgy működik, mint az Alapműveletek fülön.
              </li>
              <li>
                A szorzótábla eredmények külön adatbázisba kerülnek, saját Dashboard-dal.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">3) Dashboard</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Név szűrő:</strong> Szűrhetsz név alapján vagy nézd meg az összes eredményt.
              </li>
              <li>
                <strong>Statisztikák:</strong> Összesített adatok (próbálkozások, feladatok, helyes válaszok, időeredmények).
              </li>
              <li>
                <strong>Művelettípus:</strong> Az Alapműveletek dashboard-nál látható, hogy melyik művelettel gyakoroltál (Összeadás, Kivonás, stb.).
              </li>
              <li>
                <strong>Részletek:</strong> Kattints egy sorra a feladatok részletes megjelenítéséhez. Itt is láthatók a színes háttérrel a helyes (zöld), hibás (piros) és megnézett (sárga) feladatok.
              </li>
              <li>
                <strong>Összes adat törlése:</strong> Jelszó védett (admin123). Véglegesen törli az összes mentett adatot az adott fül adatbázisából.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">4) Egyéb beállítások</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Betűméret:</strong> A fejlécben állítható 12-24 között. Az egész alkalmazásra és a feladat táblázatokra is érvényes.
              </li>
              <li>
                <strong>Témák:</strong> Váltás nappali és éjszakai mód között a jobb felső sarokban.
              </li>
              <li>
                <strong>Beállítások mentése:</strong> A program automatikusan elmenti az összes beállítást (név, tartományok, műveletek, kiválasztott szorzótáblák), így következő indításkor ugyanazzal folytathatod.
              </li>
              <li>
                <strong>Feladat közben:</strong> Start nyomása után a beállító vezérlők inaktívvá válnak, csak a megoldás írható.
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
