# API Endpoint Implementation Plan: POST /scan

## 1. Przegląd punktu końcowego

Punkt końcowy `/scan` umożliwia wykonanie pełnego skanowania publicznego adresu URL w celu sprawdzenia jego nagłówków bezpieczeństwa HTTP i zwraca kompletny raport w tej samej odpowiedzi. Skanowanie jest wykonywane synchronicznie, co oznacza, że klient otrzymuje gotowy raport natychmiast, bez konieczności odpytywania. Endpoint analizuje nagłówki HTTP, ocenia ich bezpieczeństwo i generuje wynik liczbowy (score) reprezentujący ogólny poziom zabezpieczeń strony.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/scan`
- **Parametry**:
  - **Wymagane**: Brak parametrów w URL
  - **Opcjonalne**: Brak parametrów w URL
- **Request Body**:
  ```json
  {
    "url": "https://example.com"
  }
  ```
  - `url` (string): Pełny adres URL HTTP/HTTPS (maksymalnie 2048 znaków)

## 3. Wykorzystywane typy

```typescript
// Istniejące typy z src/types.ts
import { ScanRequestDTO, ScanResponseDTO, PublicReportDTO, HeaderEntry, Report } from "../types";

// Dodatkowe typy potrzebne do implementacji
interface ScanCommandModel {
  url: string; // Znormalizowany URL
}

interface HeaderAnalysisResult {
  detected: HeaderEntry[];
  missing: HeaderEntry[];
  leaking: HeaderEntry[];
  score: number;
}

interface ScanResult {
  hash: string;
  url: string;
  created_at: number;
  score: number;
  headers: HeaderEntry[];
  deleteToken: string;
  share_image_key: string | null;
}
```

## 4. Szczegóły odpowiedzi

### Poprawna odpowiedź (200 OK)

```json
{
  "hash": "ab12...ef", // 32-znakowy identyfikator heksadecymalny
  "url": "https://example.com", // Znormalizowany URL
  "created_at": 1713369600, // Unix epoch (sekundy)
  "score": 87, // Wynik bezpieczeństwa (0-100)
  "headers": {
    "detected": [...], // Wykryte nagłówki
    "missing": [...], // Brakujące nagłówki
    "leaking": [...] // Nagłówki ujawniające informacje
  },
  "share_image_url": "https://cdn.cloudflare.r2/.../ab12ef.png" // URL do obrazka
}
```

### Błędy

- **400 Bad Request**: Nieprawidłowy lub nieobsługiwany URL (non-HTTP/HTTPS)
  ```json
  { 
    "error": "Invalid URL format or protocol not supported",
    "code": "INVALID_URL"
  }
  ```

- **429 Too Many Requests**: Zbyt wiele skanowań tej samej domeny w ciągu ostatniej minuty
  ```json
  { 
    "error": "Rate limit exceeded: This domain was scanned in the last minute",
    "code": "RATE_LIMIT_EXCEEDED" 
  }
  ```

- **504 Gateway Timeout**: Skanowanie przekroczyło czas 45 sekund (3 próby × 15 sekund)
  ```json
  { 
    "error": "Scan timed out after 45 seconds",
    "code": "SCAN_TIMEOUT" 
  }
  ```

## 5. Przepływ danych

1. **Walidacja wejściowa**: 
   - Sprawdzenie czy URL jest poprawnym formatem HTTP/HTTPS i nie przekracza 2048 znaków
   - Sprawdzenie czy domena nie została zeskanowana w ciągu ostatniej godziny (rate-limit)

2. **Przetwarzanie**:
   - Normalizacja URL (usunięcie parametrów śledzących, ujednolicenie formatu)
   - Wykonanie żądań HTTP HEAD (z fallbackiem do GET) do podanego URL
   - Analiza nagłówków odpowiedzi i ocena bezpieczeństwa
   - Generowanie oceny (score) na podstawie pliku `weights.json`
   - Identyfikacja wyciekających informacji na podstawie `headers-leak.json`

3. **Generowanie raportu**:
   - Generowanie unikalnego 32-znakowego identyfikatora heksadecymalnego (hash)
   - Generowanie 32-znakowego tokena usuwania (deleteToken)
   - Tworzenie obrazka do udostępniania (PNG) i zapisanie go w Cloudflare KV/R2
   - Zapisanie wyników w tabeli `reports` w bazie danych D1

4. **Zwracanie odpowiedzi**:
   - Przekształcenie danych raportu na format ScanResponseDTO
   - Zwrócenie pełnego raportu w odpowiedzi HTTP

## 6. Względy bezpieczeństwa

1. **Walidacja danych wejściowych**:
   - Strict validation URL przy użyciu regularnych wyrażeń i ograniczenie długości
   - Odrzucanie niestandardowych protokołów (tylko HTTP i HTTPS)
   - Blokowanie adresów URL prowadzących do sieci wewnętrznych (localhost, adresy prywatne)

2. **Ochrona przed atakami**:
   - Wdrożenie limitowania przepustowości (1 skanowanie/domenę/godzinę) za pomocą Cloudflare WAF
   - Ustawienie limitów czasu dla żądań HTTP (15 sekund × 3 próby) aby zapobiec wyczerpaniu zasobów
   - Sanityzacja wszystkich danych wyjściowych przed umieszczeniem w odpowiedzi JSON

## 7. Obsługa błędów

1. **Nieprawidłowe dane wejściowe**:
   - Kod: 400 Bad Request
   - Przyczyny: Nieprawidłowy format URL, nieobsługiwany protokół, przekroczona maksymalna długość

2. **Przekroczenie limitu skanowania**:
   - Kod: 429 Too Many Requests
   - Przyczyny: Ta sama domena została zeskanowana w ciągu ostatniej godziny
   - Implementacja: Używanie mechanizmów Cloudflare do śledzenia i egzekwowania limitów

3. **Timeout skanowania**:
   - Kod: 504 Gateway Timeout
   - Przyczyny: Skanowanie przekroczyło 45 sekund (3 próby × 15 sekund)
   - Obsługa: Przerwanie skanowania po czasie i odpowiednie zakończenie procesu

4. **Błędy wewnętrzne**:
   - Kod: 500 Internal Server Error
   - Przyczyny: Problemy z bazą danych, błędy przy generowaniu obrazów, nieprzewidziane wyjątki
   - Logowanie: Szczegółowe logowanie do Logflare poprzez Cloudflare Logpush

## 8. Rozważania dotyczące wydajności

1. **Optymalizacja HTTP**:
   - Preferowanie żądań HEAD nad GET, gdy to możliwe
   - Implementacja opóźnień (backoff) dla wielokrotnych prób
   - Ustawienie agresywnego timeoutu (15 sekund) dla każdej próby

2. **Równoległe przetwarzanie**:
   - Równoległe generowanie obrazu do udostępniania podczas analizy nagłówków
   - Zoptymalizowane zapisywanie do bazy danych D1, używające przygotowanych zapytań

3. **Caching**:
   - Implementacja pamięci podręcznej dla często używanych zasobów (weights.json, headers-leak.json)
   - Ustawienie nagłówków cache-control dla obrazów (30 dni)

## 9. Etapy wdrożenia

1. **Konfiguracja projektu i struktura**:
   - Utworzenie struktury katalogów zgodnie z zasadami Clean Architecture
   - Konfiguracja Cloudflare Worker z odpowiednimi bindingami do D1 i KV/R2
   - Utworzenie warstw: entities, usecases, interfaces, frameworks/drivers

2. **Implementacja warstw domenowych**:
   - Utworzenie interfejsów (portów) dla repozytoriów danych, usług skanowania i generowania obrazów
   - Implementacja modeli domenowych i logiki biznesowej analizy nagłówków
   - Implementacja obliczania wyniku (score) na podstawie wag

3. **Warstwa infrastruktury**:
   - Implementacja adaptera bazy danych D1 dla operacji CRUD na raportach
   - Implementacja usługi analizy nagłówków HTTP przy użyciu Fetch API
   - Implementacja usługi KV/R2 do przechowywania i pobierania obrazów

4. **Implementacja kontrolera API**:
   - Utworzenie endpointu `/scan` z obsługą żądań POST
   - Implementacja walidacji danych wejściowych
   - Integracja logiki biznesowej z warstwą infrastruktury

5. **Obsługa błędów i monitorowanie**:
   - Implementacja centralnej obsługi błędów z odpowiednim mapowaniem na kody statusu HTTP
   - Konfiguracja logowania do Logflare z odpowiednimi poziomami detali

6. **Testowanie**:
   - Implementacja testów jednostkowych dla każdej warstwy
   - Implementacja testów integracyjnych dla całego endpointu
   - Testowanie wydajności i obciążenia dla określenia limitu czasu i przepustowości

7. **Wdrożenie**:
   - Konfiguracja CI/CD w GitHub Actions z automatycznymi testami i wdrożeniem
   - Stopniowe wdrażanie z monitorowaniem wydajności i błędów
   - Finalne wdrożenie z konfiguracją Cloudflare WAF dla limitów przepustowości
