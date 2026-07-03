import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";

/** Generic stand-in for screens built in later phases. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">This screen is coming in a later phase.</p>
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        Back home
      </Link>
    </div>
  );
}
