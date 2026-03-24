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

interface SignupProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSigninClick?: () => void;
}

export default function Signup({
  open,
  onOpenChange,
  onSigninClick,
}: SignupProps) {
  const handleSigninClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSigninClick) {
      onSigninClick();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Create workspace</DialogTitle>
            <DialogDescription>
              Create you personal workspace and manage team and task
              efficiently.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input id="workspace-name" name="workspace-name" required />
            </Field>
            <Field>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required />
            </Field>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" required />
            </Field>
            <Field>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" required />
            </Field>
            <Field>
              <Label htmlFor="confirm-password"> Confirm password</Label>
              <Input id="confirm-password" name="confirm-password" required />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="cursor-pointer">
              Create
            </Button>
          </DialogFooter>
          <div className="flex flex-row items-center justify-center">
            <p>Already have a workspace?</p>
            <Button
              variant={"link"}
              className="underline text-xs cursor-pointer"
              onClick={handleSigninClick}
            >
              Sign in
            </Button>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
