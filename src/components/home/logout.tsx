import { Button } from "@/components/button";
import { signOut } from "@junobuild/core";
import { LogOutIcon } from "lucide-react";

export const Logout = () => {
  const handleSignOut = (): Promise<void> => signOut();

  return (
    <Button
      onClick={handleSignOut}
      variant="outline"
      size="sm"
      className="whitespace-nowrap"
    >
      <LogOutIcon className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Sign Out</span>
    </Button>
  );
};
