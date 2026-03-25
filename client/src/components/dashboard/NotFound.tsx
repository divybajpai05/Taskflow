import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Assuming you use Shadcn
import { Undo2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <h2 className="text-4xl font-bold text-gray-800">404</h2>
      <p className="text-gray-600 mt-2">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button className="flex flex-row items-center cursor-pointer p-6">
          <Undo2 className="size-5"/>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
