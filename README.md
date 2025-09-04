# 🧳 Packing Buddy (PWA)
Semplice web app per organizzare la valigia. Funziona **offline**, salva **in locale** (niente account) e si può installare su iPhone come app.

## Funzioni
- Più **liste** (es. "Weekend Roma", "Mare Agosto")  
- **Categorie** (Abbigliamento, Toeletta, Elettronica, Documenti, Altro)  
- **Aggiunta rapida**: scrivi `3x magliette` → 3 quantità  
- **Peso stimato** (toggle "Pesi") con calcolo totale
- **Template** pronti (Weekend, Mare, Montagna, Business)
- **Riordina** (su/giù), spunta "messo in valigia"
- **Condivisione** / **Export** (JSON) e **Import**
- **Offline** via Service Worker (PWA)

## Avvio locale
Basta aprire `index.html` in un browser moderno. Per installare su iPhone leggi sotto.

## iPhone: Aggiungi alla Home
1. Apri `index.html` via un link HTTPS (es. GitHub Pages, Netlify) in **Safari**.  
2. Tap **Condividi** → **Aggiungi a Home**.  
3. Apri l'icona dalla Home: schermo intero, offline, come una app.

## Deployment rapido (gratis)
- **GitHub Pages**: crea repo, aggiungi questi file, attiva Pages (branch main, root).  
- **Netlify** / **Vercel**: trascina la cartella per il deploy statico.

## Note
- I dati restano nel dispositivo (LocalStorage).  
- Su iOS non c'è prompt di installazione PWA: usa "Aggiungi a Home".
