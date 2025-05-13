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

// 💾 Funzione che salva i messaggi nel foglio
async function salvaMessaggio(numero, messaggio) {
  const client = await auth.getClient();

  const spreadsheetId = "13upINlRpyvouZybt4Zh31Wpy_fgOwIgh72NJQZNtRZo"; // <-- METTI QUI L'ID DEL TUO FOGLIO

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

// 🚀 App Express
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 💬 Webhook WhatsApp
app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();

  const numero = req.body.From;
  const messaggio = req.body.Body?.toLowerCase().trim();

  console.log("📩 Nuovo messaggio da:", numero);
  console.log("📨 Messaggio:", messaggio);

  await salvaMessaggio(numero, messaggio);

  let risposta = "";

  if (messaggio === "1") {
    risposta = "📄 Ecco le info che cercavi!";
  } else if (messaggio === "2") {
    risposta = "📆 Puoi prenotare qui 👉 https://powermediasrl.it";
  } else if (["ciao", "buongiorno", "salve", "prenotare"].includes(messaggio)) {
    risposta = "👋 Ciao Mio Re! Come posso aiutarti?";
  } else {
    risposta = "🤖 Scusa Mio Re, non ho capito. Rispondi con:\n1 per Info\n2 per Prenotazioni";
  }

  twiml.message(risposta);
  res.type("text/xml").send(twiml.toString());
});

// 🟢 Porta per Render
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Bot attivo sulla porta ${port}`);
});
