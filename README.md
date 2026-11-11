# Jass-Stats

Punkte und Chritz für unsere Jassrunde: digitale Kreidetafel, automatische Chritz, Rangliste und Statistiken.

## Funktionen

- **Jassabend mit einem Tap starten.** Die nächste Paarung der Rotation (A → B → C) wird vorgeschlagen.
- **Tafel** mit Strichen (100er/50er/20er), Fortschritt bis 1500/2500 und einer Liste aller Runden. Jede Runde lässt sich nachträglich bearbeiten oder löschen.
- **Schnelle Eingabe.** Punkte eines der beiden Teams eintippen (das andere erhält den Rest auf 157), dazu Match, Multiplikator 1×–3× und Schnelltasten für Weis und Stöck.
- **Automatische Chritz mit Bestätigung:**
  - 🏔️ **Bergpreis**: das Team, das zuerst 1500 Punkte hat
  - ⚡ **Match**: jedes Team, das einen Match macht
  - 🏆 **Sieg** (2 Chritz): das Team, das zuerst 2500 Punkte hat

  Kommen beide Teams in derselben Runde über die Grenze, fragt die App, wer zuerst war.
- **Mehrere Partien pro Abend.** Nach einem Sieg geht es mit «Neue Partie» weiter.
- **Statistiken:** Siegquote, bestes Duo, Direktvergleich der Paarungen, Ø Punkte pro Runde, Weis, Rekorde, Chritz-Verlauf, Siegesserien, alles pro Saison (Jahr) filterbar.
- **Abend-Rückblick** mit Punkteverlauf jeder Partie.
- **Cloud-Datenbank (Supabase).** Alle Handys sehen live dieselben Daten. Ohne Netz wird lokal gespeichert und später synchronisiert.

## Supabase einrichten (einmalig, ca. 10 Minuten)

Ohne Supabase läuft die App wie bisher nur lokal auf einem Gerät.

1. Auf [supabase.com](https://supabase.com) ein Gratis-Konto erstellen und ein neues Projekt anlegen (Region z. B. *Central EU (Frankfurt)*).
2. Im Projekt links auf **SQL Editor** → **New query**, den ganzen Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen und **Run** klicken.
3. Unter **Project Settings → API** (bzw. **API Keys**) zwei Werte kopieren:
   - **Project URL**, z. B. `https://abcd1234.supabase.co`
   - **anon / publishable key**
4. In **Vercel** beim Projekt unter **Settings → Environment Variables** eintragen:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon / publishable key
5. In Vercel unter **Deployments** das letzte Deployment **Redeploy**en, damit die Variablen übernommen werden.

### Bestehende Daten übernehmen

Auf dem Handy, auf dem bisher gejasst wurde, die App öffnen. Sie erkennt die alten Daten und zeigt «Daten in die Cloud übernehmen?» an. Dort auf **Hochladen** tippen, fertig.

Alternativ: Auf dem alten Handy unter *Spieler → Daten → Exportieren* eine Datei speichern und sie auf einem anderen Gerät importieren.

> Hinweis: Wie gewünscht gibt es keinen Login. Wer den Link zur App kennt, kann Daten lesen und ändern. Exportiere ab und zu ein Backup (*Spieler → Daten → Exportieren*).

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Unit-Tests (Punkte, Chritz-Erkennung, Statistiken)
npm run build    # Produktions-Build
```

Für die Cloud lokal: `.env.example` nach `.env` kopieren und die Supabase-Werte eintragen.

### Aufbau

| Ordner | Inhalt |
|---|---|
| `src/lib/` | Reine Logik: Punkte (`scoring.ts`), Chritz-Erkennung, Statistiken (`stats.ts`), Aktionen (`actions.ts`) |
| `src/data/` | Speicherung: lokaler Cache, Warteschlange für Offline-Änderungen, Supabase-Sync mit Live-Updates |
| `src/components/` | UI-Bausteine, Tafel, Eingabe, Diagramme |
| `src/pages/` | Seiten: Rangliste, Tafel, Abende, Statistik, Spieler |
| `supabase/schema.sql` | Datenbank-Schema |
