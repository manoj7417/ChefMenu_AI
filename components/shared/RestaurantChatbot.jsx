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
  const [isOpen, setIsOpen] = useState(false); // Toggle chatbot

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@vapi-ai/web").then((module) => {
        const Vapi = module.default;
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || "";

        if (!apiKey) {
          setErrorMessage(
            "API key is missing. Please check your environment variables."
          );
          setStatus("Error");
          setIsApiKeyValid(false);
          return;
        }

        const vapiInstance = new Vapi(apiKey);
        setVapi(vapiInstance);
        setIsApiKeyValid(true);

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

        vapiInstance.on("speech-start", () => setIsSpeaking(true));
        vapiInstance.on("speech-end", () => setIsSpeaking(false));
        vapiInstance.on("volume-level", (level) => setVolumeLevel(level));

        vapiInstance.on("error", (error) => {
          console.error("Vapi error:", error);
          setIsConnecting(false);

          if (error?.error?.message?.includes("card details")) {
            setErrorMessage(
              "Payment required. Visit the Vapi dashboard to set up your payment method."
            );
          } else if (
            error?.error?.statusCode === 401 ||
            error?.error?.statusCode === 403
          ) {
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

    return () => {
      if (vapi) {
        vapi.stop();
      }
    };
  }, []);

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

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-gray-900 text-white rounded-lg shadow-lg w-80 max-h-[90vh] p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🍕 Vappy's Assistant</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✖
              </button>
            </div>

            {errorMessage && (
              <div className="bg-red-600 text-sm p-2 rounded mb-2">
                {errorMessage}
                {errorMessage.includes("payment") && (
                  <a
                    href="https://dashboard.vapi.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="underline block mt-1"
                  >
                    Go to Dashboard
                  </a>
                )}
              </div>
            )}

            {isConnected && (
              <>
                <p>{isSpeaking ? "Speaking..." : "Listening..."}</p>
                <div className="flex gap-1 mt-2 mb-3">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-sm ${
                        i / 10 < volumeLevel ? "bg-green-400" : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={isConnected ? endCall : startCall}
            disabled={isConnecting || !isApiKeyValid}
            className={`mt-auto py-2 px-4 text-sm font-medium rounded ${
              isConnected ? "bg-red-600 text-white" : "bg-white text-black"
            } ${
              isConnecting || !isApiKeyValid
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "End Call"
              : "Call Vappy’s Pizzeria"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-500 text-white rounded-full p-4 shadow-lg hover:bg-red-600"
          title="Open Chat"
        >
          🍕
        </button>
      )}
    </div>
  );
}

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
