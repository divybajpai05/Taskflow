import AuthDialogs from "./AuthDialog";

export default function Header() {
  return (
    <header className="z-10 bg-neutral-950/50 backdrop-blur-md flex flex-row justify-between items-center px-4 sm:px-10 py-2 sm:py-4 lg:px-40 text-white border-b border-dashed border-neutral-400/40 fixed w-full">
      <div className="flex flex-row items-center">
        <img src="logo.png" alt="logo" className="w-12 sm:w-10" />
        <div className="sm:flex flex-col cursor-pointer">
          <h1 className="pacifico-regular text-2xl font-bold tracking-wider">
            Taskflow
          </h1>
          {/* <span className="text-xs italic self-end -m-2 font-bo">
            by origin
          </span> */}
        </div>
      </div>
      <div className="">
        <AuthDialogs renderDefaultButtons={true} />
      </div>
    </header>
  );
}
