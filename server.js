const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const { google } = require("googleapis");

const sheets = google.sheets("v4");

// Legge le credenziali dall’ambiente (Render)
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Funzione per salvare i dati su Google Sheets
async function salvaMessaggio(numero, messaggio) {
  const client = await auth.getClient(); // Autenticazione con Google

  const spreadsheetId = "13upINlRpyvouZybt4Zh31Wpy_fgOwIgh72NJQZNtRZo"; // 👈 METTI QUI l'ID del tuo foglio Google

  const now = new Date().toLocaleString("it-IT");

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId, // quale foglio
    range: "Messaggi!A:C", // in quale tabella/scheda e colonne
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[numero, messaggio, now]], // i dati da scrivere
    },
  });
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();

  const numero = req.body.From;
  const messaggio = req.body.Body?.toLowerCase().trim(); // 👈 normalizziamo il testo

  console.log("📩 Nuovo messaggio da:", numero);
  console.log("📨 Messaggio:", messaggio);

  // 🔐 Salva su Google Sheets
  await salvaMessaggio(numero, messaggio);

  // 📬 Risposte dinamiche
  let risposta = "";

  if (messaggio === "1") {
    risposta = "📄 Ecco le info che cercavi!";
  } else if (messaggio === "2") {
    risposta = "📆 Puoi prenotare qui 👉 https://tuolink.com";
  } else if (["ciao", "buongiorno", "salve"].includes(messaggio)) {
    risposta = "👋 Ciao Mio Re! Come posso aiutarti?";
  } else {
    risposta = "🤖 Scusa Mio Re, non ho capito. Rispondi con:\n1 per Info\n2 per Prenotazioni";
  }

  // Invia risposta
  twiml.message(risposta);
  res.type("text/xml").send(twiml.toString());
});
