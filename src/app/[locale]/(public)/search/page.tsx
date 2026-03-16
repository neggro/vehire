import { Suspense } from "react";
import SearchWithMap from "@/components/search/search-with-map";
import { SearchPageSkeleton } from "@/components/skeletons";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchWithMap />
    </Suspense>
  );
}
