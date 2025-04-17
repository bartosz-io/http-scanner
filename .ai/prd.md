# Dokument wymagań produktu (PRD) – HTTPScanner.com (MVP)

## 1. Przegląd produktu
HTTPScanner.com to aplikacja webowa typu “scan‑and‑share”, która automatycznie analizuje publiczne witryny pod kątem obecności i jakości nagłówków bezpieczeństwa (Security Headers) zgodnych z rekomendacjami OWASP Secure Headers Project. Rezultatem skanu jest szczegółowy raport (HTML/JSON) zawierający:
* zbiorczy wynik 0–100 wyliczony z ważonych reguł,
* lista znalezionych/brakujących nagłówków,
* wskazanie nagłówków ujawniających szczegóły infrastruktury (leaking headers),
* krótkie wyjaśnienia z linkiem do materiałów edukacyjnych Dev‑Academy,
* unikalny hash‑URL pozwalający publicznie udostępniać raport,
* wygenerowana grafika share (PNG 1200 × 630) z brandingiem „Web Security Dev Academy”.

Aplikacja składa się z dwóch głównych komponentów:  
1. Front‑end hostowany na Netlify (statyczny SPA + serverless routy),  
2. Silnik skanowania jako Cloudflare Worker (server‑side, HTTP/1.1, IPv4), który realizuje skan w ≤ 15 s (maks. 3 próby × 15 s, zatrzymanie po sukcesie).

## 2. Problem użytkownika
Web‑developerzy na wszystkich poziomach doświadczenia:
* nie wiedzą, które nagłówki bezpieczeństwa są niezbędne,
* nie umieją poprawnie wdrażać polityk takich jak CSP, HSTS,
* nie posiadają prostego sposobu pomiaru i porównania poziomu bezpieczeństwa,
* nie zdają sobie sprawy, że nagłówki typu *Server* czy *X‑Powered‑By* przeciekają wrażliwe informacje.

HTTPScanner.com pozwala w minutę:
* ocenić konfigurację nagłówków,
* otrzymać jasne wskazówki poprawy,
* chwalić się wynikiem, co motywuje do dalszej edukacji.

## 3. Wymagania funkcjonalne
| ID | Wymaganie |
|----|-----------|
| FR‑01 | Użytkownik może podać publiczny URL do zeskanowania. |
| FR‑02 | Silnik skanera wykonuje zapytanie HEAD (fallback GET) w trybie follow redirect 301/302 i analizuje tylko finalną odpowiedź. |
| FR‑03 | System oblicza wynik 0–100 na podstawie wag dodatnich/ujemnych z pliku `weights.json`, normalizując do zakresu. |
| FR‑04 | Każdy nagłówek z listy `headers‑leak.json` odejmuje 1 pkt i pojawia się w sekcji “Fingerprinting headers to remove”. |
| FR‑05 | Raport (HTML + równoważny JSON) zostaje zapisany w bazie wraz z hash‑ID i deleteToken (32 znaki hex). |
| FR‑06 | Hash‑URL raportu jest publiczny; front generuje grafiki share z wynikiem i brandingiem, dodaje meta OpenGraph/Twitter. |
| FR‑07 | Rate‑limit: 1 skan na domenę (subdomeny osobno) na godzinę; 5 żądań DELETE na IP/h – egzekwowane w Cloudflare WAF. |
| FR‑08 | Endpoint `POST /api/report/delete` usuwa raport po poprawnym `hash` i `deleteToken`, zwraca 204 No Content. |
| FR‑09 | Front‑end wyświetla modal Delete/Cancel, obsługuje komunikaty sukces/błąd uniwersalnym toastem. |
| FR‑10 | Dashboard admina (basic‑auth) prezentuje: liczbę skanów/dzień, median time‑to‑scan, liczbę i skuteczność DELETE, błędy timeout. |
| FR‑11 | Aplikacja ustawia własne nagłówki CSP (`default‑src 'self'`), Referrer‑Policy (`same‑origin`), restrykcyjną Permissions‑Policy i HSTS. |
| FR‑12 | CI/CD w GitHub Actions: lint → testy jednostkowe → Playwright e2e → deploy preview → deploy produkcyjny. |
| FR‑13 | Użytkownik może udostępnić raport w mediach społecznościowych za pomocą przycisku “Share on LinkedIn/Twitter”. |
| FR‑14 | Endpoint `.well‑known/httpscanner-ignore` (200 OK) pozwala właścicielowi serwera zrezygnować z automatycznych skanów. |

## 4. Granice produktu
* Brak kont użytkowników, rejestracji i uwierzytelniania poza basic‑auth dla dashboardu administracyjnego.  
* Brak eksportu raportów (PDF/HTML), brak API publicznego w MVP.  
* Nie oceniamy poprawności detali polityki CSP (tylko jej obecność).  
* Tylko IPv4, HTTP/1.1; brak wsparcia HTTP/2 i QUIC.  
* Brak wersjonowania raportów; ponowny skan możliwy po 1 h.  
* Mobile‑app poza zakresem; front responsywny.  
* Storage grafik share i backup DB > 60 dni – do ustalenia (TBD).  
* Mixed‑content w artykułach Dev‑Academy nieobsługiwany – link otwierany w nowej karcie przeglądarki.

## 5. Historyjki użytkowników
| ID | Tytuł | Opis | Kryteria akceptacji |
|----|-------|------|---------------------|
| US‑001 | Skanowanie witryny | Jako developer chcę podać URL, aby sprawdzić moje nagłówki bezpieczeństwa. | a) Po wprowadzeniu prawidłowego URL i kliknięciu “Scan” otrzymuję wynik w ≤ 15 s. b) W raporcie widzę listę obecnych/brakujących nagłówków, wynik liczbowy i sekcję edukacyjną. |
| US‑002 | Ograniczenie częstotliwości | Jako developer otrzymuję informację, że domena została niedawno zeskanowana, aby uniknąć nadużyć. | a) Jeśli skanuję tę samą domenę przed upływem 1 h, aplikacja wyświetla komunikat o limicie i nie wykonuje skanu. |
| US‑003 | Obsługa przekierowań | Jako developer chcę, aby skaner podążał za redirectami, abym dostał wynik dla finalnego URL. | a) Raport pokazuje tylko nagłówki z odpowiedzi finalnej. b) Scoring bazuje wyłącznie na tych nagłówkach. |
| US‑004 | Informacja o leaking headers | Jako developer chcę wiedzieć, które nagłówki wyciekają dane, abym mógł je usunąć. | a) Raport zawiera listę nazw „leaking headers” oraz zalecenie ich usunięcia. b) Każdy z nich zmniejsza wynik o 1 pkt. |
| US‑005 | Udostępnienie wyniku | Jako developer chcę pochwalić się wynikiem na LinkedIn, aby pokazać dbałość o bezpieczeństwo. | a) Kliknięcie “Share on LinkedIn” otwiera okno share z poprawnym tytułem, opisem i grafiką PNG 1200 × 630. |
| US‑006 | Usunięcie raportu | Jako developer chcę usunąć raport, jeśli został wygenerowany omyłkowo. | a) Klikam „Delete”, wprowadzam deleteToken, otrzymuję toast “Report deleted”. b) Ponowne otwarcie hash‑URL zwraca 404. |
| US‑007 | Błędny token | Jako developer chcę uzyskać informację o błędnym tokenie, aby móc spróbować ponownie. | a) Przy błędnym tokenie modal pokazuje komunikat “Invalid token”. b) Operacja DELETE nie usuwa raportu. |
| US‑008 | Timeout skanu | Jako developer chcę otrzymać komunikat, gdy skan się nie powiedzie z powodu timeoutu. | a) Po 3 próbach bez odpowiedzi raport zwraca status “Scan timeout” bez obniżania wyniku. |
| US‑009 | Monitoring administratora | Jako administrator chcę widzieć statystyki skanów, aby mierzyć użycie systemu. | a) Po zalogowaniu przez basic‑auth oglądam dashboard z wykresami skanów/dzień, medianą czasu skanu, liczbą DELETE. |
| US‑010 | Opt‑out właściciela serwera | Jako właściciel strony chcę zablokować skaner, aby nie skanował mojej domeny. | a) Jeśli endpoint `/.well‑known/httpscanner-ignore` zwraca 200, każda próba skanu kończy się komunikatem “Scan disabled by site owner”. |
| US‑011 | Bezpieczne nagłówki serwisu | Jako użytkownik chcę mieć pewność, że sam serwis HTTPScanner.com stosuje rekomendowane nagłówki. | a) Analiza dev‑tools pokazuje obecność CSP, Referrer‑Policy, Permissions‑Policy i HSTS ustawionych zgodnie ze specyfikacją. |
| US‑012 | Testowanie E2E | Jako inżynier QA chcę automatycznie testować krytyczne ścieżki, aby zapewnić stabilność release. | a) W GitHub Actions testy Playwright przechodzą dla scenariuszy: scan success, timeout, invalid hash, delete success. |

## 6. Metryki sukcesu
| Metryka | Cel MVP | Narzędzie pomiaru |
|---------|--------|-------------------|
| Liczba unikalnych raportów / dzień | ≥ 10 | Dashboard admina |
| Średni czas skanu | ≤ 15 s | Logi skanera / dashboard |
| Współczynnik skutecznych DELETE | ≥ 95 % | Logi DELETE vs błędne tokeny |
| Udział share‑linków w ruchu | do ustalenia (poziom X) | UTM + analytics |
| Liczba błędów timeout / dzień | ≤ 5 % skanów | Dashboard admina |
| Dostępność usługi | ≥ 99.5 % miesięcznie | Uptimerobot / Cloudflare |