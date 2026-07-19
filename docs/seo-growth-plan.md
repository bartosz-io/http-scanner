# HTTPScanner: plan wzrostu organicznego na 90 dni

Data startu: 2026-07-17  
Cel: zwiększyć stabilny ruch organiczny z około 30 do 300–600 wizyt miesięcznie (10–20 dziennie) i dopiero wtedy uruchomić test płatnego monitoringu CSP.

## 1. Punkt startowy

| Metryka | Baseline | Źródło |
|---|---:|---|
| Organiczne wizyty / 30 dni | około 30 | deklaracja właściciela; potwierdzić w PostHog/analytics |
| Kliknięcia GSC | 97 w okresie 2026-05-24–2026-07-15 | `outputs/httpscanner.com-Performance-on-Search-2026-07-17/Wykres.csv` |
| Wyświetlenia GSC | 1 486 | jak wyżej |
| CTR GSC | 6,53% | jak wyżej |
| Średnia pozycja GSC | 13,08 | jak wyżej |
| Strony generujące ruch | 1 (`https://httpscanner.com/`) | `Strony.csv` |
| Główne frazy | `http scanner`, `https scanner`, `http scan` | `Zapytania.csv` |

Ważne: sesje organiczne w analityce i kliknięcia GSC to różne metryki. Nie należy ich łączyć. North Star mierzymy w analityce, a GSC wykorzystujemy do diagnozowania widoczności.

## 2. Cel i kamienie milowe

Główna metryka: **organiczne sesje w kroczącym oknie 30 dni**.

| Termin | Organiczne sesje / 30 dni | Kliknięcia GSC / 28 dni | Wyświetlenia GSC / 28 dni | Oczekiwany stan |
|---|---:|---:|---:|---|
| Dzień 0 | około 30 | ustalić baseline | ustalić baseline | tylko homepage generuje ruch |
| Dzień 30 | 60–100 | 50–90 | 2 000–4 000 | fundament techniczny i 2 nowe narzędzia zaindeksowane |
| Dzień 60 | 150–300 | 120–250 | 5 000–10 000 | 4 narzędzia, minimum 4 poradniki, pierwsze linki |
| Dzień 90 | 300–600 | 250–500 | 8 000–20 000 | 10–20 wizyt dziennie i stabilny ruch z kilku stron |

Kamienie milowe są celami operacyjnymi, nie gwarancją. Jeżeli strona rośnie wolniej, reguły diagnostyczne z sekcji 8 wskazują, co zmienić.

## 3. Metryki śledzone co tydzień

### Wynikowe

- organiczne sesje: 7 dni i 30 dni;
- kliknięcia, wyświetlenia, CTR i średnia pozycja w GSC;
- kliknięcia non-brand (bez `http scanner`, `https scanner` i wariantów nazwy);
- liczba wysłanych i zakończonych skanów;
- konwersja organiczna sesja → `scan submitted`;
- liczba nowych domen linkujących.

### Wyprzedzające

- liczba zaindeksowanych stron;
- liczba fraz w Top 10 i Top 20;
- liczba opublikowanych narzędzi i poradników;
- liczba zdobytych linków i wykonanych jakościowych kontaktów;
- strony z ponad 100 wyświetleniami, które nadal znajdują się poza Top 10.

Cotygodniowe wartości wpisujemy do `docs/seo-growth-scorecard.csv` w każdy poniedziałek. Dane GSC porównujemy w równych oknach 7- i 28-dniowych.

## 4. Plan realizacji

### Tydzień 1: pomiar i techniczny fundament

- [ ] Potwierdzić baseline 30-dniowych sesji organicznych w PostHog lub innym analytics.
- [ ] Utworzyć dashboard: landing page view → `scan submitted` → scan success → `report viewed`.
- [ ] Rozdzielić ruch organiczny, direct, referral i social.
- [ ] Zapewnić normalne, indeksowalne ścieżki bez `/#/` dla nowych stron.
- [ ] Dodać `sitemap.xml`, `robots.txt`, canonical i podstawowe metadane.
- [ ] Ustawić poprawny title, description i jeden główny H1 homepage.
- [ ] Sprawdzić indeksowanie i Core Web Vitals homepage.

Kryterium ukończenia: dane o źródle ruchu i skanach są widoczne w jednym dashboardzie, a Google może indeksować normalne ścieżki.

### Tydzień 2: wzmocnienie homepage

- [ ] Utrzymać skaner na `/`; nie tworzyć duplikatu `/security-headers-checker`.
- [ ] Zoptymalizować homepage pod `http scanner`, `security headers checker` i `check security headers`.
- [ ] Dodać wyjaśnienie oceny, listę badanych nagłówków, przykładowy rezultat, ograniczenia skanera i FAQ.
- [ ] Dodać linki do szczegółowych opisów CSP, HSTS, X-Frame-Options i Permissions-Policy.
- [ ] Sprawdzić snippet oraz CTR najważniejszych zapytań po 14–28 dniach.

Kryterium ukończenia: homepage jasno odpowiada na intencję użytkownika, ale narzędzie pozostaje dostępne bez przewijania.

### Tydzień 3: HTTP Headers Checker

- [ ] Opublikować `/http-headers-checker`.
- [ ] Pokazać wszystkie odebrane nagłówki, ich wartości i krótkie wyjaśnienia.
- [ ] Rozdzielić nagłówki security, caching, privacy i server disclosure.
- [ ] Dodać unikalne title, H1, opis, FAQ, schema i link do głównego security scan.

Kryterium ukończenia: strona realizuje inną funkcję niż homepage i zostaje zgłoszona do indeksowania.

### Tydzień 4: CSP Checker

- [ ] Opublikować `/csp-checker`.
- [ ] Pozwolić wkleić politykę albo pobrać ją z URL-a.
- [ ] Wykrywać brakujące dyrektywy, `unsafe-inline`, `unsafe-eval`, wildcardy i niebezpieczne schematy.
- [ ] Generować konkretne rekomendacje, ale nie obiecywać pełnego monitoringu CSP.
- [ ] Dodać linki do poradników wdrożeniowych.

Kryterium ukończenia: wynik zawiera diagnozę i zalecenia unikalne dla przekazanej polityki.

### Tydzień 5: HSTS Checker

- [ ] Opublikować `/hsts-checker`.
- [ ] Sprawdzać `max-age`, `includeSubDomains`, `preload` i przekierowanie HTTP → HTTPS.
- [ ] Wyjaśnić ryzyka przed włączeniem preload.
- [ ] Opublikować poradnik „HSTS preload requirements”.

### Tydzień 6: TLS Checker

- [ ] Opublikować `/tls-checker`.
- [ ] Pokazać wystawcę certyfikatu, daty, SAN, wspierane protokoły i podstawowe problemy.
- [ ] Dodać poradnik o wygasaniu certyfikatów i poprawnej konfiguracji TLS.

Jeżeli implementacja TLS przekracza tydzień, najpierw publikujemy wersję minimalną i nie blokujemy pozostałego planu.

### Tygodnie 7–10: klaster poradników

Opublikować minimum dwa materiały tygodniowo:

- [ ] CSP w Next.js;
- [ ] CSP w Vite/React;
- [ ] CSP w Cloudflare Workers;
- [ ] CSP w Nginx;
- [ ] security headers w Vercel;
- [ ] security headers w Netlify;
- [ ] `report-uri` vs `report-to` / `Reporting-Endpoints`;
- [ ] jak usunąć `unsafe-inline`;
- [ ] HSTS preload bez zablokowania subdomen;
- [ ] naprawa najczęściej brakujących security headers.

Każdy poradnik musi zawierać działający przykład, link do właściwego narzędzia oraz link powrotny z wyniku skanera, jeśli temat jest powiązany z wykrytym problemem.

### Tygodnie 5–12: autorytet i dystrybucja

- [ ] Opublikować GitHub Action albo CLI wykonujące skan w CI.
- [ ] Dodać opcjonalny badge wyniku do README projektu użytkownika.
- [ ] Przygotować jedną jakościową publikację techniczną tygodniowo do dystrybucji w adekwatnej społeczności.
- [ ] Wykonać 10 spersonalizowanych kontaktów tygodniowo do autorów artykułów i list narzędzi security.
- [ ] Zdobyć 5 domen linkujących do dnia 45, 10 do dnia 75 i 15–20 do dnia 90.
- [ ] Nie kupować pakietów linków i nie publikować masowych, generycznych guest postów.

## 5. Standard publikacji strony

Strona jest uznana za ukończoną dopiero, gdy:

- rozwiązuje odrębny problem użytkownika;
- ma normalny, trwały URL i canonical do siebie;
- ma unikalne title, description i H1;
- działa bez wymagania indeksowania treści po `/#/`;
- posiada przykładowy wynik, objaśnienie i ograniczenia;
- linkuje do co najmniej dwóch powiązanych stron;
- ma skonfigurowane zdarzenia użycia narzędzia;
- została dodana do sitemap i sprawdzona w Search Console;
- przechodzi `npm run lint` oraz `npm run build`.

## 6. Cotygodniowy rytm

### Poniedziałek — pomiar

- uzupełnić scorecard;
- zapisać trzy największe wzrosty i trzy największe spadki;
- wybrać jedną stronę do optymalizacji;
- potwierdzić jedno najważniejsze zadanie publikacyjne tygodnia.

### Środa — produkcja

- wdrożyć nowe narzędzie, poradnik lub istotną poprawę;
- sprawdzić linkowanie i zdarzenia analityczne;
- zgłosić URL do indeksowania.

### Piątek — dystrybucja

- wykonać outreach i dystrybucję;
- sprawdzić indeksację nowych stron;
- zanotować problemy i hipotezy na następny tydzień.

## 7. Bramka do testu CSP monitoring

Test płatnego monitoringu uruchamiamy po spełnieniu wszystkich warunków:

- minimum 300 organicznych sesji w ostatnich 30 dniach;
- minimum 80 zakończonych skanów w ostatnich 30 dniach;
- minimum 30 raportów wskazujących brakującą lub słabą CSP;
- ruch pochodzi z co najmniej trzech niezależnych landing pages;
- tracker potwierdza stabilność wyniku przez dwa kolejne tygodnie.

Wtedy dodajemy CTA CSP beta wyłącznie użytkownikom z realnym problemem CSP i mierzymy `scan result → beta CTA → email`.

## 8. Reguły diagnostyczne i decyzje

| Sygnał | Działanie |
|---|---|
| Strona niezaindeksowana po 7–10 dniach | sprawdzić status HTTP, canonical, robots, renderowany HTML, sitemap i link wewnętrzny |
| Ponad 100 wyświetleń, pozycja 11–30 | poprawić dopasowanie intencji, sekcje odpowiedzi i linkowanie wewnętrzne |
| Pozycja 4–10, CTR poniżej 4% | przetestować title i description; porównać snippet z konkurencją |
| Top 10, ale brak uruchomień narzędzia | sprawdzić intencję, UX nad foldem i zgodność frazy z funkcją |
| Brak wzrostu wyświetleń przez 3 tygodnie | wstrzymać nowe treści, sprawdzić indeksację i zdobyć linki do istniejących stron |
| Dzień 60 poniżej 100 sesji / 30 dni | ograniczyć backlog, skupić się na homepage, CSP Checker i linkach |
| Dzień 90 poniżej 150 sesji / 30 dni | nie budować CSP monitoringu; przeprowadzić rewizję techniczną i SERP |
| Dzień 90 co najmniej 300 sesji / 30 dni | uruchomić test CSP beta zgodnie z sekcją 7 |

## 9. Status programu

Status tygodnia obliczamy względem trajektorii do najbliższego kamienia milowego:

- **Green:** co najmniej 80% oczekiwanych sesji oraz wzrost wyświetleń;
- **Yellow:** 50–79% oczekiwanych sesji lub brak wzrostu przez jeden tydzień;
- **Red:** poniżej 50% przez dwa tygodnie albo problemy z indeksacją.

Najważniejszą zasadą jest nie zwiększać liczby publikowanych stron, gdy istniejące nie są indeksowane lub nie otrzymują wyświetleń. Najpierw naprawiamy dystrybucję i jakość, potem skalujemy produkcję.
