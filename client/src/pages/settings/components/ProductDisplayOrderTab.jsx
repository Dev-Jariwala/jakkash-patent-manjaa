import QueryError from "@/components/Errors/QueryError";
import { Chip } from "@/components/ui/chip";
import FormatePrice from "@/helper/FormatPrice";
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from "@/components/ui/sortable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProductsInDisplayOrder,
  reorderProductDisplayOrder,
} from "@/services/products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { arrayMove } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

const ProductDisplayOrderTab = () => {
  const queryClient = useQueryClient();
  const [activeCollection] = useLocalStorage("activeCollection", null);
  const [orderedProducts, setOrderedProducts] = useState([]);
  const orderBeforeDragRef = useRef([]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["productDisplayOrder", activeCollection],
    queryFn: async () => {
      const res = await getProductsInDisplayOrder({ activeCollection });
      return res.data.products ?? [];
    },
    enabled: Boolean(activeCollection),
  });

  useEffect(() => {
    setOrderedProducts(data ?? []);
  }, [data]);

  const sortableItems = useMemo(
    () =>
      orderedProducts.map((product) => ({
        id: product.product_id,
        product,
      })),
    [orderedProducts]
  );

  const reorderMutation = useMutation({
    mutationFn: reorderProductDisplayOrder,
    onSuccess: (res) => {
      const products = res.data?.products ?? [];
      setOrderedProducts(products);
      queryClient.setQueryData(["productDisplayOrder", activeCollection], products);
      queryClient.setQueryData(["products", activeCollection], products);
      queryClient.invalidateQueries({ queryKey: ["products", activeCollection] });
      queryClient.invalidateQueries({ queryKey: ["prodcutsReport", { collection_id: activeCollection }] });
    },
    onError: () => {
      toast.error("Product display order could not be saved");
      setOrderedProducts(orderBeforeDragRef.current);
      refetch();
    },
  });

  const handleMove = useCallback(
    ({ activeIndex, overIndex }) => {
      const nextOrder = arrayMove(orderedProducts, activeIndex, overIndex);
      orderBeforeDragRef.current = orderedProducts;
      setOrderedProducts(nextOrder);
      reorderMutation.mutate({
        activeCollection,
        product_ids: nextOrder.map((row) => row.product_id),
      });
    },
    [activeCollection, orderedProducts, reorderMutation]
  );

  if (!activeCollection) {
    return (
      <div className="px-1 py-8 text-muted-foreground">
        Choose a collection to arrange product display order.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="basic-loader"></div>
      </div>
    );
  }

  if (isError) {
    return <QueryError error={error} />;
  }

  return (
    <div className="max-w-5xl rounded-lg border border-border bg-card shadow-sm">
      <p className="px-6 pt-6 pb-2 text-sm text-muted-foreground">
        Drag a row to change product display order for this collection. The sequence
        is shared by retail and wholesale Orders and the products report.
      </p>
      <Sortable value={sortableItems} onMove={handleMove}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Product name</TableHead>
              <TableHead>Retail price</TableHead>
              <TableHead>Wholesale price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortableItems.map(({ id, product }) => {
              const active = product.is_active !== false;
              return (
                <SortableItem key={id} value={id} asChild>
                  <TableRow>
                    <TableCell className="w-10">
                      <SortableDragHandle
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        disabled={reorderMutation.isPending}
                      >
                        <GripVertical className="h-4 w-4" />
                      </SortableDragHandle>
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.product_name}
                    </TableCell>
                    <TableCell>
                      <FormatePrice price={product.retail_price} />
                    </TableCell>
                    <TableCell>
                      <FormatePrice price={product.wholesale_price} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant="light"
                        border="none"
                        size="xs"
                        color={active ? "green" : "red"}
                      >
                        {active ? "Active" : "Inactive"}
                      </Chip>
                    </TableCell>
                  </TableRow>
                </SortableItem>
              );
            })}
          </TableBody>
        </Table>
      </Sortable>
    </div>
  );
};

export default ProductDisplayOrderTab;