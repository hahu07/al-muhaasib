"use client";

import { Button } from "@/components/button";
import { signIn } from "@junobuild/core";

export const Login = () => {
  const signWithII = async () => {
    await signIn({
      internet_identity: {
        options: {
          domain: "id.ai",
        },
      },
    });
  };

  return <Button onClick={signWithII}>Continue with Internet Identity</Button>;
};
