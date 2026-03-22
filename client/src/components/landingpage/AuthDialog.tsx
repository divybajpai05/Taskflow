import { useState } from "react";
import Signin from "./Signin";
import Signup from "./Signup";
import { Button } from "../ui/button";

interface AuthDialogsProps {
  trigger?: React.ReactNode;
  renderDefaultButtons?: boolean;
}

export default function AuthDialogs({
  trigger,
  renderDefaultButtons = true,
}: AuthDialogsProps) {
  const [isSigninOpen, setIsSigninOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const openSignin = () => {
    setIsSignupOpen(false);
    setIsSigninOpen(true);
  };

  const openSignup = () => {
    setIsSigninOpen(false);
    setIsSignupOpen(true);
  };

  return (
    <>
      {renderDefaultButtons && (
        <div className="flex flex-row gap-2">
          <Button
            onClick={openSignin}
            className="shine-glass border-neutral-600 sm:px-6 sm:py-5 sm:rounded-full cursor-pointer"
          >
            Login
          </Button>
          <Button
            className="cursor-pointer sm:px-10 sm:py-5 sm:rounded-full text-neutral-950"
            variant={"secondary"}
            onClick={openSignup}
          >
            Get Started
          </Button>
        </div>
      )}

      {trigger && (
        <div onClick={openSignup}>
          {trigger}
        </div>
      )}

      <Signin
        open={isSigninOpen}
        onOpenChange={setIsSigninOpen}
        onSignupClick={openSignup}
      />
      <Signup
        open={isSignupOpen}
        onOpenChange={setIsSignupOpen}
        onSigninClick={openSignin}
      />
    </>
  );
}
