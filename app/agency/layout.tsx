import "./_src/agency.css";
import { Toaster } from "./_src/components/ui/toaster";

// Wraps all /agency routes: applies the scoped Agency theme + mounts the Toaster
// used by the calculators (useToast).
export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="agency-scope">
      {children}
      <Toaster />
    </div>
  );
}
