import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";

import QueryError from "@/components/Errors/QueryError";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionsOptions } from "@/services/collections";

const ActiveCollectionSelect = () => {
  const [activeCollection, setActiveCollection] = useLocalStorage("activeCollection", null);
  const {
    data: collectionsOptions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["collectionsOptions"],
    queryFn: async () => {
      const res = await getCollectionsOptions();
      return res.data?.collections?.map((c) => ({ value: c?.collection_id, label: c?.collection_name })) || [];
    },
  });

  useEffect(() => {
    if (!activeCollection && collectionsOptions?.[0]?.value) {
      setActiveCollection(collectionsOptions?.[0]?.value || null);
    }
  }, [collectionsOptions, activeCollection, setActiveCollection]);

  if (isLoading) {
    return <Skeleton className="h-9 w-[148px] rounded-lg" />;
  }

  if (isError) {
    return <QueryError error={error} />;
  }

  return (
    <Select
      value={activeCollection}
      onValueChange={(value) => setActiveCollection(value)}
    >
      <SelectTrigger className="h-9 w-[148px] rounded-lg border-border bg-background shadow-none focus:ring-1 focus:ring-ring">
        <SelectValue placeholder="Collection" />
      </SelectTrigger>
      <SelectContent>
        {collectionsOptions?.map((option) => (
          <SelectItem key={option?.value} value={option?.value}>
            {option?.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ActiveCollectionSelect;
