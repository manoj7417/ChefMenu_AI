"use client";

import { useEffect, useState } from "react";

export default function PizzaAssistant() {
  const [vapi, setVapi] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);

  // Initialize Vapi on client-side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@vapi-ai/web").then((module) => {
        const Vapi = module.default;

        // Get API key from environment variables - only check once
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || "";

        if (!apiKey) {
          setErrorMessage(
            "API key is missing. Please check your environment variables."
          );
          setStatus("Error");
          setIsApiKeyValid(false);
          return;
        }

        // Initialize Vapi
        const vapiInstance = new Vapi(apiKey);
        setVapi(vapiInstance);
        setIsApiKeyValid(true);

        // Set up event listeners
        vapiInstance.on("call-start", () => {
          setIsConnecting(false);
          setIsConnected(true);
          setErrorMessage("");
          setStatus("Connected");
        });

        vapiInstance.on("call-end", () => {
          setIsConnecting(false);
          setIsConnected(false);
          setStatus("Call ended");
        });

        vapiInstance.on("speech-start", () => {
          setIsSpeaking(true);
        });

        vapiInstance.on("speech-end", () => {
          setIsSpeaking(false);
        });

        vapiInstance.on("volume-level", (level) => {
          setVolumeLevel(level);
        });

        vapiInstance.on("error", (error) => {
          console.error("Vapi error:", error);
          setIsConnecting(false);

          // Handle different types of errors
          if (error?.error?.message?.includes("card details")) {
            setErrorMessage(
              "Payment required. Visit the Vapi dashboard to set up your payment method."
            );
          } else if (
            error?.error?.statusCode === 401 ||
            error?.error?.statusCode === 403
          ) {
            // API key is invalid - update state
            setErrorMessage(
              "API key is invalid. Please check your environment variables."
            );
            setIsApiKeyValid(false);
          } else {
            setErrorMessage(error?.error?.message || "An error occurred");
          }

          setStatus("Error");
        });
      });
    }

    // Cleanup function
    return () => {
      if (vapi) {
        vapi.stop();
      }
    };
  }, []);

  // Start call function - no need to recheck API key
  const startCall = () => {
    if (!isApiKeyValid) {
      setErrorMessage("Cannot start call: API key is invalid or missing.");
      return;
    }

    setIsConnecting(true);
    setStatus("Connecting...");
    setErrorMessage("");

    vapi.start(assistantOptions);
  };

  // End call function
  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: "30px" }}>Pizza Voice Assistant</h1>

      <div style={{ marginBottom: "20px" }}>
        <p>Status: {status}</p>

        {isConnected && (
          <div style={{ marginTop: "10px" }}>
            <p>
              {isSpeaking ? "Assistant is speaking" : "Assistant is listening"}
            </p>

            {/* Simple volume indicator */}
            <div
              style={{
                display: "flex",
                marginTop: "10px",
                marginBottom: "10px",
                gap: "3px",
              }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "15px",
                    height: "15px",
                    backgroundColor: i / 10 < volumeLevel ? "#3ef07c" : "#444",
                    borderRadius: "2px",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: "#f03e3e",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <p>{errorMessage}</p>

          {errorMessage.includes("payment") && (
            <a
              href="https://dashboard.vapi.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                marginTop: "10px",
                color: "white",
                textDecoration: "underline",
              }}
            >
              Go to Vapi Dashboard
            </a>
          )}
        </div>
      )}

      <button
        onClick={isConnected ? endCall : startCall}
        disabled={isConnecting || !isApiKeyValid}
        style={{
          backgroundColor: isConnected ? "#f03e3e" : "white",
          color: isConnected ? "white" : "black",
          border: "none",
          borderRadius: "8px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: "500",
          cursor: isConnecting || !isApiKeyValid ? "not-allowed" : "pointer",
          opacity: isConnecting || !isApiKeyValid ? 0.7 : 1,
        }}
      >
        {isConnecting
          ? "Connecting..."
          : isConnected
          ? "End Call"
          : "Call Vappy's Pizzeria Shop"}
      </button>
    </div>
  );
}

// Pizza assistant configuration
const assistantOptions = {
  name: "Pizza Assistant",
  firstMessage: "Vappy's Pizzeria speaking, how can I help you?",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
  },
  voice: {
    provider: "playht",
    voiceId: "jennifer",
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a voice assistant for Vappy's Pizzeria, a restaurant shop located on the Internet.

Your job is to take the order of customers calling in. The menu includes a wide variety of Indian dishes such as starters, mains, breads, rice, and sides.
Starters like Papadum Basket, Vegetable Samosa, and Tandoori Paneer.

Main courses including Chicken Tikka Masala, Paneer Butter Masala, and Lamb Rogan Josh.

Sides & breads such as Butter Naan, Jeera Rice, and Cucumber Raita.

Oh, and yeah — we’ve got both veg and non-veg options!

Customers can only order 1 of each item. If a customer tries to order more
than 1 item within each category, politely inform them that only 1 item per
category may be ordered.

Customers must order 1 item from at least 1 category to have a complete order.
They can order just a pizza, or just a side, or just a drink.

Be sure to introduce the menu items, don't assume that the caller knows what
is on the menu (most appropriate at the start of the conversation).

If the customer goes off-topic or off-track and talks about anything but the
process of ordering, politely steer the conversation back to collecting their order.

Once you have all the information you need pertaining to their order, you can
end the conversation. You can say something like "Awesome, we'll have that ready
for you in 10-20 minutes." to naturally let the customer know the order has been
fully communicated.

It is important that you collect the order in an efficient manner (succinct replies
& direct questions). You only have 1 task here, and it is to collect the customers
order, then end the conversation.

- Be sure to be kind of funny and witty!
- Keep all your responses short and simple. Use casual language, phrases like "Umm...", "Well...", and "I mean" are preferred.
- This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.`,
      },
    ],
  },
};

// const assistantOptions = {
//   name: "Pizza Assistant",
//   firstMessage:
//     "वैपी की पिज़्ज़ेरिया में आपका स्वागत है! मैं आपकी कैसे मदद कर सकता हूँ?",
//   transcriber: {
//     provider: "deepgram",
//     model: "nova-2",
//     language: "hi",
//   },
//   voice: {
//     provider: "11labs",
//     voiceId: "pGYsZruQzo8cpdFVZyJc", // Smriti - Indian Storyteller
//   },
//   model: {
//     provider: "openai",
//     model: "gpt-4",
//     messages: [
//       {
//         role: "system",
//         content: `आप वैपी की पिज़्ज़ेरिया के लिए एक वॉयस असिस्टेंट हैं। आपका काम ग्राहकों से ऑर्डर लेना है।

// मेन्यू में ये शामिल है:
// - स्टार्टर: पापड़म बास्केट, वेज समोसा, तंदूरी पनीर
// - मुख्य कोर्स: चिकन टिक्का मसाला, पनीर बटर मसाला, लैम्ब रोगन जोश
// - ब्रेड और साइड्स: बटर नान, जीरा राइस, ककड़ी रायता

// हर कैटेगरी से ग्राहक केवल 1 आइटम ऑर्डर कर सकता है।

// अगर ग्राहक ऑफ-टॉपिक हो जाए, तो बातचीत को ऑर्डर पर वापस लाएं।

// मजेदार, हल्की-फुल्की भाषा का इस्तेमाल करें। जवाब छोटे और सीधे हों।

// जब ऑर्डर पूरा हो जाए, तो कहें: "ऑर्डर कन्फर्म हो गया है, 10-20 मिनट में तैयार हो जाएगा!"`,
//       },
//     ],
//   },
// };
