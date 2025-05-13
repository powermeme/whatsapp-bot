const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/whatsapp", (req, res) => {
  const twiml = new MessagingResponse();

  console.log("📩 Nuovo messaggio da:", req.body.From);
  console.log("📨 Messaggio:", req.body.Body);

  twiml.message("Ciao Mio Re! 👑 Ho ricevuto il tuo messaggio!");

  res.type("text/xml").send(twiml.toString());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ Bot attivo sulla porta " + port);
});
