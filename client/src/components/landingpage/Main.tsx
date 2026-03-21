import { RadialGlow } from "../ui/gloweffect";

export default function Main() {
  return (
    <section className="relative max-h-screen">
      <div className="absolute inset-0 overflow-hidden">
        <RadialGlow
          color="purple"
          size="xl"
          opacity="medium"
          className="top-1/4 -left-1/4"
        />
        <RadialGlow
          color="blue"
          size="lg"
          opacity="medium"
          className="bottom-1/4 -right-1/4"
        />
        <RadialGlow
          color="pink"
          size="md"
          opacity="strong"
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl font-bold text-white mb-4">
          Welcome to TaskFlow
        </h1>
        <p className="text-xl text-gray-300">
          Your Ultimate Task Management Solution
        </p>
      </div>
    </section>
  );
}
