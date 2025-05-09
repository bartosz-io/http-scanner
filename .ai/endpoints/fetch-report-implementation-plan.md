# API Endpoint Implementation Plan: GET `/report/{hash}`

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania wcześniej wygenerowanego raportu na podstawie jego unikalnego identyfikatora (hash). Jest to kluczowy element funkcjonalności udostępniania raportów, umożliwiający użytkownikom dostęp do wyników skanowania poprzez linki bezpośrednie.

## 2. Szczegóły żądania
- Metoda HTTP: **GET**
- Struktura URL: `/report/{hash}`
- Parametry:
  - Wymagane: `hash` (32-znakowy identyfikator heksadecymalny raportu)
  - Opcjonalne: brak
- Request Body: brak (metoda GET)

## 3. Wykorzystywane typy
- **FetchReportResponseDTO**: Typ odpowiedzi zawierający dane raportu (zdefiniowany w `src/types.ts`)
- **Report**: Encja domeny reprezentująca raport (zdefiniowana w `worker/entities/Report.ts`)
- **ReportRepository**: Interfejs repozytorium do operacji na raportach
- **FetchReportUseCase**: Przypadek użycia do pobierania raportu
- **ReportController**: Kontroler obsługujący żądania dotyczące raportów

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "hash": "32-znakowy identyfikator heksadecymalny",
    "url": "znormalizowany URL, który został przeskanowany",
    "created_at": 1650000000, // Unix timestamp
    "score": 75, // Wynik bezpieczeństwa (0-100)
    "headers": {
      "detected": [...], // Wykryte nagłówki bezpieczeństwa
      "missing": [...], // Brakujące nagłówki bezpieczeństwa
      "leaking": [...] // Nagłówki ujawniające informacje
    },
    "share_image_url": "https://cdn.httpscanner.com/images/abc123.png" // lub null
  }
  ```
- Błąd (404 Not Found):
  ```json
  {
    "error": "Report not found",
    "code": "NOT_FOUND"
  }
  ```

## 5. Przepływ danych
1. Żądanie HTTP trafia do endpointu `/report/{hash}`
2. Kontroler wyodrębnia parametr `hash` z URL
3. Kontroler waliduje format parametru `hash`
4. Kontroler przekazuje żądanie do przypadku użycia `FetchReportUseCase`
5. Przypadek użycia wywołuje metodę `findByHash` z `ReportRepository`
6. Repozytorium wykonuje zapytanie do bazy danych D1
7. Repozytorium mapuje wynik zapytania na obiekt domeny `Report`
8. Przypadek użycia zwraca obiekt `Report` do kontrolera
9. Kontroler używa `ReportMapper` do przekształcenia obiektu `Report` na DTO
10. Kontroler zwraca odpowiedź HTTP z odpowiednim statusem i danymi

## 6. Względy bezpieczeństwa
- Walidacja parametru `hash` - sprawdzenie czy jest to dokładnie 32-znakowy ciąg heksadecymalny
- Brak ujawniania wrażliwych danych - `deleteToken` nie jest zwracany w odpowiedzi
- Brak uwierzytelniania - endpoint jest publicznie dostępny, ale ujawnia tylko bezpieczne dane
- Nagłówki CORS - zapewnienie, że odpowiedź może być odczytana przez przeglądarki z różnych domen

## 7. Obsługa błędów
- **404 Not Found**: Gdy raport o podanym hashu nie istnieje lub został usunięty
- **400 Bad Request**: Gdy format parametru `hash` jest nieprawidłowy
- **500 Internal Server Error**: Gdy wystąpi nieoczekiwany błąd podczas przetwarzania żądania

## 8. Rozważania dotyczące wydajności
- Indeksowanie kolumny `hash` w tabeli `reports` dla szybkiego wyszukiwania
- Cachowanie odpowiedzi na poziomie Cloudflare Workers dla często odwiedzanych raportów
- Minimalizacja rozmiaru odpowiedzi poprzez grupowanie nagłówków w kategorie

## 9. Etapy wdrożenia

1. **Rozszerzenie interfejsu ReportRepository**
   - Dodanie metody `findByHash(hash: string): Promise<Report | null>`

2. **Implementacja metody findByHash w D1ReportRepository**
   - Zapytanie SQL do bazy danych D1
   - Mapowanie wyników na obiekt domeny Report

3. **Utworzenie nowego przypadku użycia FetchReportUseCase**
   - Implementacja logiki pobierania raportu
   - Obsługa przypadku, gdy raport nie istnieje

4. **Rozszerzenie ReportMapper**
   - Dodanie metody `toFetchReportResponseDTO` (podobnej do istniejącej `toScanResponseDTO`)

5. **Utworzenie ReportController**
   - Implementacja metody `handleFetchReport`
   - Walidacja parametru `hash`
   - Mapowanie odpowiedzi

6. **Rejestracja nowego endpointu w głównym pliku worker/index.ts**
   - Dodanie obsługi trasy GET `/report/:hash`
   - Konfiguracja zależności

7. **Testy**
   - Testy jednostkowe dla nowych komponentów
   - Testy integracyjne dla całego przepływu
   - Testy wydajnościowe dla scenariuszy z dużym obciążeniem

8. **Dokumentacja**
   - Aktualizacja dokumentacji API
   - Dodanie przykładów użycia
