import { useState } from "react";
import Signin from "./Signin";
import Signup from "./Signup";
import { Button } from "../ui/button";

export default function AuthDialogs() {
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
      <Button
        onClick={openSignin}
        className="border-neutral-600 sm:px-6 sm:py-5 rounded-full cursor-pointer"
      >
        Login
      </Button>
      <Button
        className="cursor-pointer sm:px-10 sm:py-5 rounded-full text-neutral-950"
        variant={"secondary"}
        onClick={openSignup}
      >
        Get Started
      </Button>

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
