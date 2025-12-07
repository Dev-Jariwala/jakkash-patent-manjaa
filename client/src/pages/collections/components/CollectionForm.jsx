import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BreadCrum from "@/components/breadcrum/BreadCrum";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
import { toast } from "react-toastify";
import { createCollection, getCollectionById, updateCollection } from "@/services/collections";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Checkbox } from "@/components/ui/checkbox";

const schema = yup.object().shape({
    collection_name: yup.string().required("Collection name is required"),
    copy_collection_id: yup.string().notRequired(),
});

const CollectionForm = () => {
    const [activeCollection] = useLocalStorage("activeCollection");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const formType = location.pathname.split("/")[2];
    const [searchParams] = useSearchParams();
    const collection_id = searchParams.get("collection_id");
    const collections = queryClient.getQueriesData({ queryKey: ['collectionsOptions'] })?.[0]?.[1];
    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            collection_name: "",
            copy_collection_id: "",
        },
    });

    const { data: collection, isLoading, isError, error, } = useQuery({
        queryKey: ["collections", collection_id],
        queryFn: async () => {
            const res = await getCollectionById(collection_id);
            return res.data.collection;
        },
        enabled: !!collection_id && formType === "update",
    });

    const createCollectionMutation = useMutation({
        mutationFn: createCollection,
        onSuccess: () => {
            navigate("/collections");
            queryClient.invalidateQueries(["collections"]);
            toast.success("Collection created successfully");
        },
        onError: () => {
            toast.error("Error creating collection");
        }
    });
    const updateCollectionMutation = useMutation({
        mutationFn: updateCollection,
        onSuccess: () => {
            navigate("/collections");
            queryClient.invalidateQueries(["collections"]);
            toast.success("Collection updated successfully");
        },
        onError: () => {
            toast.error("Error updating collection");
        }
    });
    const onSubmit = async (data) => {
        console.log({ data });
        if (formType === "new") {
            createCollectionMutation.mutate(data);
        } else if (formType === "update") {
            updateCollectionMutation.mutate({ data, collection_id });
        }
    };
    useEffect(() => {
        if (collection) {
            form.reset({
                collection_name: collection.collection_name,
            });
        }
    }, [collection]);

    useEffect(() => {
        if (error) {
            toast.error("Error fetching collection");
        }
    }, [error]);

    if (!collection && formType === "update") {
        return (
            <div className="text-center text-xl text-red-500 font-medium">
                This product does not belong to this collection.
            </div>
        );
    }
    return (
        <div className="">
            <div className="flex items-center justify-between px-5 border-b border-gray-200 py-4 mb-3">
                <div className="text-xl text-gray-700 font-semibold">
                    <BreadCrum
                        path={[
                            { path: "/", label: "Dashboard" },
                            { path: "/collections", label: "Collections" },
                            {
                                path: `/collections/${formType}?collection_id=${collection_id}`,
                                label: `${formType}`,
                            },
                        ]}
                    />
                </div>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-full px-5"
                >
                    <div className=" grid lg:grid-cols-3 gap-5">
                        <FormField
                            control={form.control}
                            name="collection_name"
                            render={({ field }) => (
                                <FormItem className="">
                                    <FormLabel>
                                        Collection Name <sup className="text-red-500 text-base -top-0">*</sup>
                                    </FormLabel>
                                    <FormControl>
                                        <Input variant='ringShadow' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {formType === 'new' && <FormField
                            control={form.control}
                            name="copy_collection_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border px-4 shadow">
                                    <FormControl>
                                        <Checkbox
                                            className="space-y-0"
                                            checked={!!field.value}
                                            onCheckedChange={(value) => field.onChange(value ? activeCollection : "")}
                                        />
                                    </FormControl>
                                    <div className=" leading-none">
                                        <FormLabel>
                                            {`Inclue all products from "${collections?.find(c => c.value === activeCollection)?.label}" collection`}
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />}

                    </div>
                    <div className="w-full mt-5">
                        <MutationError mutation={createCollectionMutation} />
                        {isError && !isLoading && (
                            <QueryError className={"mb-5"} error={error} />
                        )}
                        <Button variant="" disabled={createCollectionMutation?.isPending || updateCollectionMutation.isPending} isLoading={createCollectionMutation?.isPending || updateCollectionMutation.isPending} loadingText={formType === 'update' ? 'updating...' : 'creating...'} className="bg-indigo-500 hover:bg-indigo-600" type="submit">
                            {collection_id && formType === "update" ? "Update" : "Create"}{" "}
                            Collection
                        </Button>
                    </div>
                </form>{" "}
            </Form>}
        </div>
    );
};

export default CollectionForm;
