import { Button } from "../ui/button";

export default function Header() {
  return (
    <div className="flex flex-row justify-between items-center py-4 px-40 text-white border-b border-b-neutral-800 fixed w-full">
      <div className="flex flex-row gap-2 items-center">
        <img src="favicon.svg" alt="logo" width={20} />
        <h1 className="text-xl">Taskflow</h1>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button className="border-neutral-600 px-6 py-5 rounded-full cursor-pointer">Login</Button>
        <Button
          className="cursor-pointer px-10 py-5 rounded-full text-neutral-950"
          variant={"secondary"}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
