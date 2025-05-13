const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const { google } = require("googleapis");

const sheets = google.sheets("v4");

// 🔐 Autenticazione Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// 💾 Salva il messaggio nel foglio
async function salvaMessaggio(numero, messaggio) {
  const client = await auth.getClient();

  const spreadsheetId = "13upINlRpyvouZybt4Zh31Wpy_fgOwIgh72NJQZNtRZo"; // <-- ID FOGLIO

  const now = new Date().toLocaleString("it-IT");

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId,
    range: "Messaggi!A:C",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[numero, messaggio, now]],
    },
  });
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();

  const numero = req.body.From;
  const messaggio = req.body.Body?.toLowerCase().trim();

  console.log("📩 Nuovo messaggio da:", numero);
  console.log("📨 Messaggio:", messaggio);

  await salvaMessaggio(numero, messaggio);

  // 📬 Risposta dinamica
  let risposta = "";

  if (
    messaggio.includes("info") ||
    messaggio.includes("ho bisogno di info") ||
    messaggio.includes("dammi info")
  ) {
    risposta =
      "ℹ️ *Ecco tutte le informazioni utili:*\n\n" +
      "📍 *Negozio*: 091xxxxxxx\n" +
      "✉️ *Email*: assistenza@powermediasrl.it\n" +
      "🌐 *Sito*: https://www.powermediasrl.it";
  } else {
    risposta =
      "👋 *Benvenuto sulla messaggistica automatica di PowermediaSRL!*\n\n" +
      "Per ricevere informazioni scrivi:\n*ho bisogno di INFO*";
  }

  twiml.message(risposta);
  res.type("text/xml").send(twiml.toString());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Bot attivo sulla porta ${port}`);
});
