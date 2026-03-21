import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Field, FieldGroup } from "../ui/field";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SigninProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSignupClick?: () => void;
}

export default function Signin({
  open,
  onOpenChange,
  onSignupClick,
}: SigninProps) {
  const handleSignupClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSignupClick) {
      onSignupClick();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Sign in</DialogTitle>
            <DialogDescription>Welcome Back!</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" required />
            </Field>
            <Field>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" required />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <div className="flex flex-row justify-between w-full">
              <Button className="text-xs cursor-pointer underline" variant={"link"}>
                Forget password
              </Button>
              <div className="flex flex-row gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="cursor-pointer">
                  Sign in
                </Button>
              </div>
            </div>
          </DialogFooter>
          <div className="flex flex-row items-center justify-center">
            <p>New here?</p>
            <Button
              variant={"link"}
              className="underline text-xs cursor-pointer"
              onClick={handleSignupClick}
            >
              Create workspace
            </Button>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
