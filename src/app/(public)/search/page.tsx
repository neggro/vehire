import { Suspense } from "react";
import SearchWithMap from "@/components/search/search-with-map";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SearchWithMap />
    </Suspense>
  );
}
