import { Construction } from "lucide-react";
import { Link } from "react-router-dom";

/** Generic stand-in for screens built in later phases. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-hero-subtle">
        <Construction className="h-9 w-9 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1.5 text-muted-foreground">This screen is coming soon.</p>
      </div>
      <Link
        to="/"
        className="inline-flex h-11 items-center rounded-xl bg-primary px-6 font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-glow"
      >
        Back to home
      </Link>
    </div>
  );
}
