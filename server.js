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

// 💾 Salvataggio messaggio
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
  const msgPulito = messaggio.replace(/[^a-z0-9]/gi, "").trim();
  
  console.log("📩 Nuovo messaggio da:", numero);
  console.log("📨 Messaggio:", messaggio);

  await salvaMessaggio(numero, messaggio);

  let risposta = "";

 // Normalizza numero (toglie spazi, simboli, emoji)
const msgPulito = messaggio.replace(/[^a-z0-9]/gi, "").trim();

if (msgPulito === "1") {
  risposta =
    "ℹ️ *INFO PowermediaSRL:*\n" +
    "📍 Negozio: 091xxxxxxx\n" +
    "✉️ Email: assistenza@powermediasrl.it\n" +
    "🌐 Sito: https://www.powermediasrl.it";
} else if (msgPulito === "2") {
  risposta = "🛠️ *Assistenza tecnica*: scrivi a *assistenza@powermediasrl.it*";
} else if (msgPulito === "3") {
  risposta = "📞 Un operatore ti contatterà il prima possibile!";
} else if (msgPulito === "4") {
  risposta = "🌐 Visita il nostro sito: https://www.powermediasrl.it";
}


  // 🔍 Risposte dinamiche per parole chiave
  else if (messaggio.includes("info")) {
    risposta =
      "ℹ️ *Ecco tutte le informazioni utili:*\n\n" +
      "📍 *Negozio*: 091xxxxxxx\n" +
      "✉️ *Email*: assistenza@powermediasrl.it\n" +
      "🌐 *Sito*: https://www.powermediasrl.it";
  } else if (messaggio.includes("assistenza") || messaggio.includes("supporto")) {
    risposta = "🆘 Per assistenza scrivici a *assistenza@powermediasrl.it*";
  } else if (messaggio.includes("telefono") || messaggio.includes("numero")) {
    risposta = "📞 Il nostro numero è *091xxxxxxx*";
  } else if (messaggio.includes("sito") || messaggio.includes("web")) {
    risposta = "🌐 Il nostro sito è: https://www.powermediasrl.it";
  } else if (
    messaggio.includes("operatore") ||
    messaggio.includes("parlare") ||
    messaggio.includes("chiamare")
  ) {
    risposta = "📲 Ti faremo contattare da un operatore il prima possibile!";
  }

  // 🧊 Risposta predefinita
  else {
    risposta =
      "👋 *Benvenuto sulla messaggistica automatica di PowermediaSRL!*\n\n" +
      "Rispondi con:\n" +
      "1️⃣ per *Info aziendali*\n" +
      "2️⃣ per *Assistenza*\n" +
      "3️⃣ per *Operatore*\n" +
      "4️⃣ per *Sito Web*";
  }

  twiml.message(risposta);
  res.type("text/xml").send(twiml.toString());
});

// 🚪 Porta (per Render)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Bot attivo sulla porta ${port}`);
});
