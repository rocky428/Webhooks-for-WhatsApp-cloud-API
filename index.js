const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require('dotenv').config();

const app = express().use(body_parser.json());

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN; // prasath_token
const phone_number_id = process.env.PHONE_NUMBER_ID; // Phone number ID from .env

app.use(express.urlencoded({ extended: true }));

app.listen(process.env.PORT, () => {
    console.log("webhook is listening");
});

// Serve HTML page for manual reply
app.get("/", (req, res) => {
    res.send(`
        <html>
            <body>
                <h1>Send Manual WhatsApp Message</h1>
                <form action="/send-manual" method="post">
                    <label for="phone">Phone Number:</label>
                    <input type="text" id="phone" name="phone" required>
                    <br><br>
                    <label for="message">Message:</label>
                    <textarea id="message" name="message" required></textarea>
                    <br><br>
                    <button type="submit">Send Message</button>
                </form>
            </body>
        </html>
    `);
});

// Endpoint to handle form submission
app.post("/send-manual", (req, res) => {
    const { phone, message } = req.body;

    axios({
        method: "POST",
        url: `https://graph.facebook.com/v20.0/${phone_number_id}/messages?access_token=${token}`,
        data: {
            messaging_product: "whatsapp",
            to: phone,
            text: { body: message }
        },
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        res.send("Message sent successfully!");
    }).catch(error => {
        console.error("Error sending message:", error);
        res.send("Failed to send message.");
    });
});

// Verification endpoint
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    if (mode && token) {
        if (mode === "subscribe" && token === mytoken) {
            res.status(200).send(challenge);
        } else {
            res.status(403).send("Forbidden");
        }
    }
});

// Receive webhook events
app.post("/webhook", (req, res) => {
    let body_param = req.body;
    console.log(JSON.stringify(body_param, null, 2));

    if (body_param.object) {
        console.log("inside body param");
        if (body_param.entry &&
            body_param.entry[0].changes &&
            body_param.entry[0].changes[0].value.messages &&
            body_param.entry[0].changes[0].value.messages[0]
        ) {
            let phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body_param.entry[0].changes[0].value.messages[0].from;
            let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

            console.log("phone number " + phon_no_id);
            console.log("from " + from);
            console.log("body param " + msg_body);

            // Remove or comment out the auto-reply code below
            /*
            axios({
                method: "POST",
                url: `https://graph.facebook.com/v13.0/${phone_number_id}/messages?access_token=${token}`,
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    text: { body: "Hi.. I'm Prasath, your message is " + msg_body }
                },
                headers: { "Content-Type": "application/json" }
            }).then(() => res.sendStatus(200)).catch(error => {
                console.error("Error sending reply:", error);
                res.sendStatus(500);
            });
            */

            res.sendStatus(200); // Acknowledge the webhook event without replying
        } else {
            res.sendStatus(404);
        }
    }
});

