import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-950 text-white px-4 sm:px-10 py-10 sm:py-20 lg:px-40 border-t border-dashed border-neutral-400/40">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center">
          <img src="logo.png" alt="logo" className="w-12 sm:w-10" />
          <h1 className="pacifico-regular text-2xl font-bold tracking-wider">
            Taskflow
          </h1>
        </div>
        <p className="font-light">Task & Team management software.</p>
      </div>

      <div className="font-light">
        <span> Developed by </span>{" "}
        <Link
          className="hover:underline underline-offset-4 text-orange-600 pacifico-regular"
          to={"https://origincreativeagency.com/"}
          target="_blank"
        >
          origincreativeagency.com
        </Link>
      </div>
    </div>
  );
}
