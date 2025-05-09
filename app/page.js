import Image from "next/image";
import Chatbot from "./components/Chatbot";
import RestaurantChatbot from "./components/RestaurantChatbot";

export default function Home() {
  return (
    <>
      {/* <Chatbot /> */}
      <RestaurantChatbot />
    </>
  );
}
