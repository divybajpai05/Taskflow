import Capabilities from "./Capabilities";
import Hero from "./Hero";

export default function Main() {
  return (
    <main className="flex flex-col min-h-screen">
      <Hero />

      <div className="relative text-white px-4 sm:px-10 xl:px-40 p-10 bg-neutral-950 border border-dashed border-t border-neutral-400/40">
        <Capabilities />
      </div>
    </main>
  );
}
