# Migracja HTTPScanner z Vite SPA do Astro SSG

Data planu: 2026-07-19  
Status: M3 ukończone
Szacowany czas: 5–7 dni roboczych

## 1. Cel migracji

Przenieść publiczną warstwę serwisu z pojedynczej aplikacji Vite korzystającej z `createHashRouter` do Astro generującego statyczny HTML, bez przepisywania backendu Hono ani logiki skanera.

Po migracji:

- publiczne strony mają normalne, indeksowalne URL-e i kompletny HTML;
- formularz skanera, lista skanów i raport pozostają komponentami React;
- istniejący Worker Hono nadal obsługuje D1, R2, `/api/*` i `/share/*`;
- `/report/:hash` używa jednego statycznego shellu raportu i pobiera dane po stronie klienta;
- nie wdrażamy SSR Astro ani adaptera `@astrojs/cloudflare`;
- nowe checkery i poradniki trafiają do sitemap dopiero wtedy, gdy mają działającą funkcję i pełną treść.

## 2. Decyzje architektoniczne

### 2.1 Astro działa jako SSG

Docelowo Astro buduje publiczne strony do `dist/`. W M1 równoległy, niewdrażany
build trafia do `dist-astro/`, aby nie nadpisać artefaktów legacy przed cutoverem.
W M6 zmienimy `outDir` na `dist/`. Ustawiamy jawnie:

```js
export default defineConfig({
  site: 'https://httpscanner.com',
  output: 'static',
  build: { format: 'directory' },
});
```

Nie instalujemy adaptera Cloudflare. Astro nie korzysta bezpośrednio z bindingów D1/R2; pozostają one wyłącznie w istniejącym Workerze.

### 2.2 Routing publiczny nie należy już do Reacta

Docelowy podział odpowiedzialności:

| Trasa | Właściciel | Renderowanie | Indeksowanie |
|---|---|---|---|
| `/` | Astro | statyczny HTML + React islands | tak |
| `/reports` | Astro + React island | statyczny shell + lista z API | nie na początku |
| `/report/:hash` | Hono + statyczny shell + React | CSR | nie |
| `/share/:hash` | Hono | HTML z Open Graph | nie |
| `/api/*` | Hono | JSON | nie dotyczy |
| `/404` | Astro/Cloudflare Assets | statyczny HTML ze statusem 404 | nie |
| przyszłe `/...-checker` | Astro + React islands | SSG + hydratacja | dopiero z gotowym produktem |
| przyszłe `/guides/*` | Astro/MDX | SSG | tak |

Nie zastępujemy `createHashRouter` przez `createBrowserRouter`. Po migracji główny React Router jest zbędny.

### 2.3 React pozostaje tylko tam, gdzie potrzebna jest interakcja

Planowane wyspy:

| Wyspa | Dyrektywa | Powód |
|---|---|---|
| `ScannerIsland.tsx` | `client:load` | formularz musi działać natychmiast |
| `RecentScansIsland.tsx` | `client:visible` | dane są poniżej głównej części strony |
| `ReportsIsland.tsx` | `client:load` | interaktywna paginacja i odświeżanie |
| `ReportIsland.tsx` | `client:only="react"` | hash jest dynamiczny, a raport ma `noindex` |

Header, footer, nawigacja, tekst SEO i metadane powstają jako komponenty `.astro`, bez wysyłania Reacta do przeglądarki.

### 2.4 Jeden shell dla wszystkich raportów

Astro generuje `dist/report/index.html`. Dla żądania `/report/abc123` Worker zwraca ten plik przez binding `ASSETS`, bez zmiany URL-a.

```text
GET /report/abc123?token=xyz
  → Worker Hono
  → ASSETS.fetch('/report/index.html')
  → ReportIsland odczytuje hash i token z location
  → GET /api/report/abc123
```

Odpowiedź shellu otrzymuje jednocześnie:

- `<meta name="robots" content="noindex,nofollow">`;
- nagłówek `X-Robots-Tag: noindex, nofollow`;
- statyczny fallback/skeleton;
- poprawny status 200 dla poprawnego formatu ścieżki.

Nieznany lub usunięty hash może dać shell 200, ale API zwraca 404 i UI pokazuje komunikat. Nieprawidłowy format hasha jest odrzucany po stronie klienta bez wywołania API.

### 2.5 Cloudflare serwuje assety przed Workerem

Docelowa konfiguracja `wrangler.jsonc`:

```jsonc
"assets": {
  "directory": "./dist",
  "binding": "ASSETS",
  "not_found_handling": "404-page",
  "run_worker_first": [
    "/api/*",
    "/share/*",
    "/report/*"
  ]
}
```

Zwykłe strony Astro i hashowane assety są obsługiwane bez uruchamiania Workera. Worker uruchamia się tylko dla ścieżek aplikacyjnych.

### 2.6 Kompatybilność ze starymi adresami

Fragmentu `#` serwer nie otrzymuje, więc nie da się zrobić dla niego HTTP 301. Na homepage dodajemy mały skrypt kompatybilności:

```text
/#/report/:hash?token=... → location.replace('/report/:hash?token=...')
/#/reports                → location.replace('/reports')
/#/                       → location.replace('/')
```

Ponadto:

- wszystkie nowe linki i przekierowania używają normalnych URL-i;
- `/share/:hash` przekierowuje do `/report/:hash`, nie do `/#/report/:hash`;
- po usunięciu raportu użytkownik wraca na `/`;
- backendowe `report_url` już używa poprawnego formatu `/report/:hash` i nie wymaga zmiany kontraktu.

### 2.7 Analityka jest niezależna od kontekstu React

Astro islands nie współdzielą kontekstu React. Usuwamy zależność logiki domenowej od `usePostHog()` i wprowadzamy jeden browser-safe moduł analityczny.

Wymagania:

- brak `window` i `posthog.init()` podczas generowania HTML;
- inicjalizacja PostHog tylko raz w przeglądarce;
- zachowanie zdarzeń `scan submitted`, `scan failed`, `report viewed`, share i delete;
- brak podwójnego pageview po hydratacji;
- parametr `token` nie może trafić do eventów ani autocapture;
- `ReportIsland` odczytuje token do stanu i usuwa go z paska adresu przez `history.replaceState`.

## 3. Docelowa struktura plików

```text
astro.config.mjs
shared/
└── reportHash.ts
src/
├── components/
│   ├── astro/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   └── SeoHead.astro
│   ├── islands/
│   │   ├── ScannerIsland.tsx
│   │   ├── RecentScansIsland.tsx
│   │   ├── ReportsIsland.tsx
│   │   └── ReportIsland.tsx
│   ├── report/...
│   └── ui/...
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── analytics.ts
│   ├── legacyHashRoute.ts
│   └── reportLocation.ts
├── pages/
│   ├── index.astro
│   ├── reports.astro
│   ├── report/
│   │   └── index.astro
│   └── 404.astro
└── styles/
    └── global.css
public/
├── robots.txt
└── favicon.*
worker/
├── index.ts
└── routes/
    └── reportShellRoute.ts
```

Po zakończeniu migracji usuwamy nieużywane:

- `index.html`;
- `src/main.tsx`;
- `src/App.tsx`;
- `src/router.tsx`;
- Reactowe wersje headera, footera i nawigacji, jeśli nie mają już konsumentów;
- `vite.config.ts`, jeśli cała konfiguracja Vite została przeniesiona do Astro;
- `react-router-dom`, `@vitejs/plugin-react-swc`, `@cloudflare/vite-plugin` i `@posthog/react`, jeżeli audyt importów potwierdzi brak użycia.

## 4. Etapy implementacji

### M0 — kontrakt migracji i safety net (0,5 dnia)

- [x] Utworzyć branch `codex/astro-migration`.
- [x] Zapisać statusy i przykładowe odpowiedzi dla `/`, `/api/reports`, `/api/report/:hash` i `/share/:hash`.
- [x] Zapisać listę obecnych eventów PostHog oraz właściwości, które muszą przetrwać.
- [x] Dodać minimalne testy funkcji mapujących stare URL-e i parsujących `/report/:hash`.
- [x] Ustalić testowy hash raportu do lokalnej weryfikacji bez używania produkcyjnego tokenu usuwania.

Kryterium ukończenia: znamy zachowanie, które migracja ma zachować, i mamy testowalne przykłady URL-i.

### M1 — równoległy build Astro (0,5–1 dnia)

- [x] Dodać `astro`, `@astrojs/react`, `@astrojs/sitemap` i narzędzia do `astro check`.
- [x] Usunąć lub zaktualizować bezpośrednie zależności wskazane przez baseline `npm audit`; nie używać automatycznego `audit fix` bez testów kontraktowych.
- [x] Utworzyć `astro.config.mjs` z React, Tailwind, aliasem `@` i `output: 'static'`.
- [x] Dostosować TypeScript i ESLint do plików Astro bez osłabiania istniejących reguł TS.
- [x] Wprowadzić minimalny browser-safe moduł analityczny i usunąć inicjalizację PostHog z modułowego poziomu `main.tsx`, aby prerender nie odwoływał się do `window`.
- [x] Dodać skrypty `dev:web`, `dev:worker`, `check`, `build`, `preview` i `deploy`.
- [x] Zachować tymczasowy `build:legacy`, dopóki homepage i raport nie przejdą testów.
- [x] Ustawić proxy deweloperskie `/api` i `/share` z Astro do lokalnego Workera.

Kryterium ukończenia: minimalna strona Astro buduje się równolegle do `dist-astro`,
jej wyspa React hydratyzuje się w przeglądarce, proxy trafia do lokalnego Workera,
a legacy UI i Worker nadal kompilują się osobno. Wyniki są w
`docs/astro-migration-m1.md`.

### M2 — statyczny layout i homepage (1–1,5 dnia)

- [x] Przenieść globalny CSS/Tailwind do wejścia Astro.
- [x] Utworzyć `BaseLayout.astro` z `lang="en"`, viewportem, faviconą i propsami SEO.
- [x] Przenieść header, footer i nawigację do komponentów Astro z normalnymi `<a href>`.
- [x] Zmienić nazwę produktu w headerze z nagłówka H1 na link/tekst; homepage ma dokładnie jeden główny H1.
- [x] Wydzielić `ScannerIsland`, zastąpić `useNavigate()` normalnym przejściem do `/report/:hash?token=...` i użyć browser-safe modułu analitycznego zamiast `usePostHog()`.
- [x] Wydzielić `RecentScansIsland`; kliknięcie wiersza prowadzi do normalnego URL-a.
- [x] Utworzyć `/reports` jako działającą stronę z istniejącą paginacją, ale początkowo `noindex` i poza sitemap.
- [x] Usunąć lub zastąpić linki do nieistniejących `/about` i `/how-it-works`; nie publikować placeholderów.
- [x] Dodać skrypt przekierowujący stare hash routes.

Kryterium ukończenia: `dist-astro/index.html` zawiera title, description,
canonical, pojedynczy H1, opis narzędzia i HTML formularza przed uruchomieniem
JavaScriptu; w interfejsie nie ma linków `/#/`. Wyniki są w
`docs/astro-migration-m2.md`.

### M3 — raport bez React Routera (1–1,5 dnia)

- [x] Zmienić `ReportView`, aby przyjmował `hash` i `token` jako props zamiast `useParams()` i `useSearchParams()`.
- [x] Utworzyć `ReportIsland`, który bezpiecznie parsuje `window.location` po stronie klienta.
- [x] Przenieść eventy z `usePostHog()` w komponentach raportu, share i delete do wspólnego modułu analitycznego.
- [x] Przenieść statyczny header/footer raportu do shellu Astro.
- [x] Zachować skeleton, błędy API, udostępnianie i usuwanie raportu.
- [x] Usunąć token z URL-a po zapisaniu go w stanie komponentu.
- [x] Dodać `reportShellRoute` w Hono i binding `ASSETS` do typu `Env`.
- [x] Dodać `X-Robots-Tag` oraz meta robots dla report shellu.
- [x] Zaktualizować `/share/:hash`, aby przekierowywał do `/report/:hash`.
- [x] Zmienić wszystkie powroty po usunięciu/błędzie z `/#/` na `/`.

Kryterium ukończenia: bezpośrednie wejście i odświeżenie `/report/:hash` działa bez hash routera, a raport nie jest indeksowalny.

### M4 — SEO techniczne i obsługa błędów (0,5–1 dnia)

- [x] Zweryfikować istniejące canonicale i centralne propsy metadanych oraz wydzielić produkcyjny `SITE_ORIGIN`.
- [x] Dodać `@astrojs/sitemap` z filtrem wykluczającym `/report/`, `/reports`, `/share/` i strony `noindex`.
- [x] Dodać `robots.txt`.
- [x] Dodać statyczne `404.astro` i `not_found_handling: "404-page"`.
- [x] Sprawdzić, że nieznany URL nie otrzymuje homepage ze statusem 200.
- [x] Ustawić odpowiednie cache headers dla hashowanych assetów; HTML pozostawić rewalidowalny.
- [x] Nie dodawać jeszcze stron przyszłych checkerów do routera ani sitemap.

Kryterium ukończenia: crawler otrzymuje poprawne statusy, canonicale, robots i sitemap bez pustych/technicznych tras.

### M5 — analityka i hydratacja (0,5–1 dnia)

- [x] Dokończyć usuwanie `PostHogProvider` jako globalnego root SPA oraz sprawdzić, że nie pozostał żaden import `usePostHog()`.
- [x] Zachować nazwy i właściwości istniejących eventów.
- [x] Dodać landing page/path i referrer tam, gdzie są potrzebne do scorecard SEO.
- [x] Sprawdzić, że pageview nie jest wysyłany podwójnie.
- [x] Sprawdzić, że delete token i pełny URL z tokenem nie trafiają do PostHog.
- [x] Sprawdzić brak błędów hydratacji w konsoli dla homepage i raportu.

Kryterium ukończenia: lejek `landing page → scan submitted → scan success → report viewed` działa po migracji i nie zbiera sekretów.

### M6 — test produkcyjny, cleanup i cutover (1 dzień)

- [ ] Uruchomić `npm run lint`, `npm run check` i `npm run build`.
- [ ] Uruchomić build przez lokalny `wrangler dev`, nie tylko `astro preview`.
- [ ] Wykonać macierz testów z sekcji 5 w przeglądarce desktop i mobile.
- [ ] Sprawdzić HTML odpowiedzi bez JavaScriptu.
- [ ] Sprawdzić requesty `/api`, `/share` i `/report` w logach Workera.
- [ ] Usunąć stary entrypoint SPA i zależności po potwierdzeniu braku importów.
- [ ] Wykonać końcowy build po cleanupie.
- [ ] Wdrożyć najpierw wersję testową/preview, następnie produkcję.
- [ ] Po wdrożeniu sprawdzić homepage, przykładowy raport, share preview i PostHog.
- [ ] Zgłosić sitemap i homepage do ponownej inspekcji w Search Console.

Kryterium ukończenia: wszystkie testy przechodzą na buildzie identycznym z produkcyjnym, a powrót do poprzedniej wersji jest możliwy jednym redeployem.

## 5. Macierz testów akceptacyjnych

| Scenariusz | Oczekiwany wynik |
|---|---|
| `GET /` bez JavaScriptu | 200, canonical `/`, unikalne title/description/H1, widoczny formularz |
| Uruchomienie poprawnego skanu | API odpowiada, przejście do `/report/:hash?token=...` |
| Wejście bezpośrednie na `/report/:hash` | 200 shell, `noindex`, raport pobrany z API |
| Refresh `/report/:hash` | raport nadal działa, brak 404 z asset routera |
| Niepoprawny hash | komunikat walidacyjny, brak niepotrzebnego requestu API |
| Nieistniejący poprawny hash | API 404, czytelny stan błędu |
| Token w query | funkcja delete działa; token znika z URL-a i nie trafia do analytics |
| `/share/:hash` | poprawne OG/Twitter tags i przejście do normalnego report URL-a |
| `/#/report/:hash` | klient wykonuje `replace` do `/report/:hash` |
| `/api/scan` i `/api/reports` | kontrakty odpowiedzi bez zmian |
| `/reports` | lista, refresh i load more działają; strona ma `noindex` |
| Nieznana trasa | prawdziwe 404, nie homepage ze statusem 200 |
| Nawigacja publiczna | brak linków `/#/`; brak linków do placeholderów |
| Build HTML | brak wyjątków `window is not defined` i hydration mismatch |
| Mobile | formularz, tabela i raport nie wychodzą poza viewport |

## 6. Testy automatyczne i polecenia bramkujące

Minimalny zestaw przed każdym wdrożeniem:

```text
npm run lint
npm run check
npm run test
npm run build
```

Nowe testy powinny pokryć przynajmniej:

- parsowanie `/report/:hash` i odrzucanie złych hashy;
- konwersję legacy `/#/...` do normalnych URL-i;
- usuwanie `token` z URL-a bez utraty go ze stanu UI;
- zachowanie filtrów sitemap/noindex;
- trasę Workera zwracającą report shell i `X-Robots-Tag`.

Po buildzie uruchamiamy również smoke test na `wrangler dev`, ponieważ `astro preview` nie weryfikuje integracji z istniejącym Workerem Hono i bindingiem `ASSETS`.

## 7. Ryzyka i zabezpieczenia

| Ryzyko | Zabezpieczenie |
|---|---|
| `window`/PostHog przerywa prerender | osobny moduł browser-only i test `astro build` od pierwszego etapu |
| komponent oczekuje kontekstu React Router | audyt wszystkich importów `react-router-dom`; props lub normalny link |
| `/report/:hash` kończy jako Cloudflare 404 | jawny `run_worker_first` i test direct navigation przez Wrangler |
| Worker przechwytuje wszystkie statyczne strony | `run_worker_first` tylko dla trzech grup tras |
| token usuwania trafia do analytics | odczyt do stanu, natychmiastowy `replaceState`, test event payload |
| nowe strony są thin content | brak placeholderów i filtr sitemap do czasu ukończenia produktu |
| lokalny Astro działa, ale produkcyjny Worker nie | osobny etap testu `astro build + wrangler dev` |
| regresja share preview | test OG HTML i aktualizacja obu linków `/#/report` w `shareRoute` |
| migracja miesza się z rozwojem produktu | zamrożenie nowych checkerów do zakończenia M6 |

## 8. Strategia rollbacku

- Migrację wykonujemy na osobnym branchu i nie usuwamy legacy builda przed M6.
- Przed deployem zapisujemy identyfikator działającej wersji Workera i commit produkcyjny.
- Nie wykonujemy migracji D1 ani zmian formatu danych, więc rollback nie wymaga cofania bazy.
- Jeżeli po cutoverze nie działa homepage, API lub report shell, wdrażamy poprzedni commit/wersję Workera.
- Legacy redirect ze ścieżek hash pozostaje przez minimum 90 dni po migracji.

## 9. Tracking wykonania

| Milestone | Status | Dowód ukończenia |
|---|---|---|
| M0 — kontrakt i safety net | complete | `astro-migration-baseline.md`; 31 testów; lint i legacy build przechodzą |
| M1 — build Astro | complete | `astro-migration-m1.md`; check, oba buildy, proxy i hydratacja przechodzą |
| M2 — homepage i islands | complete | `astro-migration-m2.md`; statyczny HTML, dane API i islands przechodzą |
| M3 — report shell | complete | `astro-migration-m3.md`; direct navigation i refresh przez Wrangler |
| M4 — SEO techniczne | complete | `astro-migration-m4.md`; 57 testów; sitemap, robots, canonical, prawdziwe 404 i cache headers |
| M5 — PostHog i hydratacja | complete | `astro-migration-m5.md`; 73 testy; event audit, atrybucja sesji, brak tokenu i czysta hydratacja |
| M6 — cleanup i cutover | pending | pełna macierz testów + produkcyjny smoke test |

Statusy aktualizujemy na `in progress`, `blocked` albo `complete`. Każde `complete` musi zawierać dowód: polecenie, wynik testu, screenshot lub URL wdrożenia.

## 10. Zakres poza migracją

Poniższe prace zaczynają się dopiero po M6:

- implementacja `/http-headers-checker` jako odrębnego produktu;
- implementacja `/csp-checker`, `/hsts-checker` i `/tls-checker`;
- publikacja `/guides/*` i ewentualne Content Collections/MDX;
- SSR lub indeksowanie raportów;
- monitoring CSP i jego monetyzacja;
- przebudowa API lub schematu D1.

Astro tworzy pod te prace fundament, ale sama migracja nie publikuje stron bez wartości użytkowej.

## 11. Źródła techniczne

- [Astro na Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
- [Cloudflare Workers Static Assets — binding i `run_worker_first`](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Integracja React w Astro](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Astro routing i `getStaticPaths`](https://docs.astro.build/en/reference/routing-reference/)
