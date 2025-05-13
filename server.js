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
  const messaggio = req.body.Body;

  console.log("📩 Nuovo messaggio da:", numero);
  console.log("📨 Messaggio:", messaggio);

  await salvaMessaggio(numero, messaggio); // 👈 questa salva sul foglio

  twiml.message("Ciao Mio Re! 👑 Ho ricevuto il tuo messaggio!");
  res.type("text/xml").send(twiml.toString());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ Bot attivo sulla porta " + port);
});
