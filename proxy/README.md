# KI-Proxy für den Englisch-Trainer

Die App spricht Englisch mit einem Gesprächspartner. Dafür braucht sie ein Sprachmodell. **Der API-Schlüssel bleibt hier auf dem Server** und steht nicht in `index.html` und nicht im Handy.

Die App schickt nur Szene, Niveau und den bisherigen Chat an die Adresse, die du in den Einstellungen einträgst.

## Was du brauchst

- Ein kostenloses Konto bei [Cloudflare](https://dash.cloudflare.com)
- Node.js auf dem Rechner, mit dem du deployest
- Einen Schlüssel von einem Anbieter mit OpenAI-kompatibler Schnittstelle, zum Beispiel OpenAI, Groq oder OpenRouter

## 1. Schlüssel und Modell

Im Ordner `proxy`:

```bash
npm install
npx wrangler login
npx wrangler secret put AI_API_KEY
```

Die Abfrage nach dem Schlüssel tippst du ein. Er landet nur bei Cloudflare.

Standard ist OpenAI, Modell `gpt-4o-mini`. Das steht in `wrangler.toml`:

```toml
[vars]
AI_BASE_URL = "https://api.openai.com/v1"
AI_MODEL = "gpt-4o-mini"
```

Andere Anbieter, Beispiele:

| Anbieter | AI_BASE_URL | AI_MODEL |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Groq | `https://api.groq.com/openai/v1` | Modellname aus der Groq-Doku |
| OpenRouter | `https://openrouter.ai/api/v1` | z. B. `openai/gpt-4o-mini` |

Wenn ein Modell kein JSON-Format erzwingt und der Worker mit Fehler 400 antwortet, setze in `wrangler.toml` zusätzlich `AI_JSON_MODE = "off"`.

## 2. Deployen

```bash
npx wrangler deploy
```

Am Ende zeigt Wrangler eine Adresse wie `https://englisch-trainer-ai.<dein-name>.workers.dev`. Die trägst du in der App ein.

Lokal ausprobieren, ohne zu deployen:

```bash
cp .dev.vars.example .dev.vars
# AI_API_KEY in .dev.vars eintragen
npx wrangler dev
```

Dann in der App als Adresse `http://127.0.0.1:8787` eintragen. Auf dem iPhone erreichst du `127.0.0.1` deines Computers nicht. Dafür die deployte `https://…workers.dev`-Adresse nutzen. Spracherkennung im Browser verlangt außerdem, dass **die App selbst** über https läuft (localhost geht am Rechner).

## 3. Optional: Token, damit nicht jeder deinen Worker nutzen kann

```bash
npx wrangler secret put APP_TOKEN
```

Denk dir einen langen Zufallstext aus. Denselben Text trägst du in der App unter **Mehr → Einstellungen → Zugangs-Token** ein. Ohne dieses Secret ist der Worker offen, aber auf etwa 30 Chats pro Minute und IP begrenzt. Der Token ist nicht der API-Schlüssel.

## 4. In der App eintragen

1. App öffnen → **Mehr → Einstellungen**
2. **Proxy-Adresse:** `https://englisch-trainer-ai.<dein-name>.workers.dev` (ohne `/chat` am Ende)
3. Token nur ausfüllen, wenn du `APP_TOKEN` gesetzt hast
4. **Verbindung testen**

Danach: **Üben → KI-Gesprächspartner**. Ohne Adresse zeigt die App die Szenen trotzdem und lässt dich feste Sätze nachsprechen.

## Was der Worker annimmt

`POST /chat`

```json
{
  "scenario": "restaurant",
  "level": "A2",
  "history": [
    {"role": "assistant", "content": "Hi! What can I get you?"},
    {"role": "user", "content": "I want a coffee."}
  ]
}
```

Szenen: `restaurant`, `cafe`, `smalltalk`, `job`, `hotel`, `doctor`, `shopping`, `directions`, `phone`, `plans`.

Antwort:

```json
{
  "reply": "Sure. What size would you like?",
  "hint_de": "Welche Größe möchtest du?",
  "correction": "Besser: I would like a coffee.",
  "better": "I would like a coffee."
}
```

`GET /health` prüft, ob der Worker erreichbar ist und ob ein Schlüssel gesetzt ist. Der Schlüssel selbst kommt nicht zurück.
