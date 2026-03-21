import Footer from "../components/landingpage/Footer";
import Header from "../components/landingpage/Header";
import Main from "../components/landingpage/Main";

export default function LandingPage() {
  return (
    <div className="bg-neutral-950 min-h-screen">
      <Header />
      <Main />
      <Footer />
    </div>
  );
}
