import Chatbot from "@/components/shared/Chatbot";
// import RestaurantChatbot from "../components/shared/RestaurantChatbot";
import HeroSection from "@/components/shared/HeroSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="fixed bottom-0 right-4 z-50">
        {/* <RestaurantChatbot /> */}
        <Chatbot />
      </div>
    </>
  );
}
