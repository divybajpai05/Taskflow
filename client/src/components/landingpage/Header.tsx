import AuthDialogs from "./AuthDialog";

export default function Header() {
  return (
    <header className="z-10 bg-neutral-950/50 backdrop-blur-md flex flex-row justify-between items-center px-10 py-4 lg:px-40 text-white border-b border-b-neutral-800 fixed w-full">
      <div className="flex flex-row gap-2 items-center">
        <img src="logo.png" alt="logo" width={36} />
        <h1 className="special-font text-xl font-semibold tracking-wider">
          Taskflow
        </h1>
      </div>
      <div className="flex flex-row items-center gap-2">
        <AuthDialogs/>
      </div>
    </header>
  );
}
