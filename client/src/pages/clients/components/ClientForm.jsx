import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BreadCrum from "@/components/breadcrum/BreadCrum";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
import { toast } from "react-toastify";
import ReactSelect from "@/components/ui/react-select/react-select";
import { createClient } from "@/services/clients";
import { getCities, getCountries, getStates } from "@/services/common";
import { Textarea } from "@/components/ui/textarea";

const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const schema = yup.object().shape({
    name: yup.string().trim().required("Name is required").max(100),
    mobile: yup
        .string()
        .required("Mobile is required")
        .matches(/^\d{10}$/, "Mobile must be exactly 10 digits"),
    address: yup.string().trim().required("Address is required").max(255),
    pincode: yup
        .string()
        .transform((value) => (value === "" ? undefined : value))
        .notRequired()
        .matches(/^\d{6}$/, { message: "Pincode must be exactly 6 digits", excludeEmptyString: true }),
    state_id: yup.string().required("State is required"),
    city_id: yup.string().required("City is required"),
    gst_number: yup
        .string()
        .transform((value) => (value === "" ? undefined : value?.replace(/\s+/g, "").toUpperCase()))
        .notRequired()
        .test("gstin", "GST number must be a valid 15-character GSTIN", (value) => {
            if (!value) return true;
            return value.length === 15 && gstinPattern.test(value);
        }),
    contact_person: yup.string().trim().max(100).notRequired(),
    contact_number: yup
        .string()
        .transform((value) => (value === "" ? undefined : value))
        .notRequired()
        .matches(/^\d{10}$/, { message: "Contact number must be exactly 10 digits", excludeEmptyString: true }),
});

const ClientForm = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            mobile: "",
            address: "",
            pincode: "",
            state_id: "",
            city_id: "",
            gst_number: "",
            contact_person: "",
            contact_number: "",
        },
    });

    const selectedStateId = form.watch("state_id");

    const {
        data: countries,
        isLoading: isCountriesLoading,
        isError: isCountriesError,
        error: countriesError,
    } = useQuery({
        queryKey: ["countries"],
        queryFn: async () => {
            const response = await getCountries();
            return response.data?.countries ?? [];
        },
    });

    const indiaCountryId = useMemo(
        () => countries?.find((c) => c.iso2 === "IN")?.country_id,
        [countries]
    );

    const {
        data: states,
        isLoading: isStatesLoading,
        isError: isStatesError,
        error: statesError,
    } = useQuery({
        queryKey: ["states", indiaCountryId],
        queryFn: async () => {
            const response = await getStates(indiaCountryId);
            return response.data?.states ?? [];
        },
        enabled: Boolean(indiaCountryId),
    });

    const {
        data: cities,
        isLoading: isCitiesLoading,
        isError: isCitiesError,
        error: citiesError,
    } = useQuery({
        queryKey: ["cities", selectedStateId],
        queryFn: async () => {
            const response = await getCities(selectedStateId);
            return response.data?.cities ?? [];
        },
        enabled: Boolean(selectedStateId),
    });

    const stateOptions = useMemo(
        () => states?.map((s) => ({ label: s.name, value: s.state_id })) ?? [],
        [states]
    );

    const cityOptions = useMemo(
        () => cities?.map((c) => ({ label: c.name, value: c.city_id })) ?? [],
        [cities]
    );

    useEffect(() => {
        const cityId = form.getValues("city_id");
        if (!cityId || !cities?.length) {
            return;
        }
        const stillValid = cities.some((c) => c.city_id === cityId);
        if (!stillValid) {
            form.setValue("city_id", "");
        }
    }, [selectedStateId, cities, form]);

    const createClientMutation = useMutation({
        mutationFn: async (data) => {
            const response = await createClient({
                name: data.name,
                mobile: data.mobile,
                address: data.address,
                pincode: data.pincode || undefined,
                state_id: data.state_id,
                city_id: data.city_id,
                gst_number: data.gst_number || undefined,
                contact_person: data.contact_person || undefined,
                contact_number: data.contact_number || undefined,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            navigate("/clients");
            toast.success("Client created successfully");
        },
        onError: (error) => {
            const message =
                error?.response?.data?.message || "Error creating client";
            error.message = message;
            toast.error(message);
        },
    });

    const onSubmit = (data) => {
        createClientMutation.mutate(data);
    };

    const isLocationLoading = isCountriesLoading || isStatesLoading;

    return (
        <div>
            <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
                <div className="text-xl text-foreground font-semibold">
                    <BreadCrum
                        path={[
                            { path: "/", label: "Dashboard" },
                            { path: "/clients", label: "Clients" },
                            { path: "/clients/new", label: "Add Client" },
                        ]}
                    />
                </div>
            </div>
            <div className="px-5 max-w-2xl pb-10">
                {isCountriesError && <QueryError error={countriesError} />}
                {isStatesError && <QueryError error={statesError} />}
                {isCitiesError && <QueryError error={citiesError} />}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <MutationError mutation={createClientMutation} />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Client name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="10-digit mobile"
                                            inputMode="numeric"
                                            maxLength={10}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pincode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pincode (optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="6-digit pincode"
                                            inputMode="numeric"
                                            maxLength={6}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="state_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <FormControl>
                                        <ReactSelect
                                            options={stateOptions}
                                            value={
                                                stateOptions.find(
                                                    (o) => o.value === field.value
                                                ) ?? null
                                            }
                                            onChange={(option) =>
                                                field.onChange(option?.value ?? "")
                                            }
                                            placeholder={
                                                isLocationLoading
                                                    ? "Loading states..."
                                                    : "Select state"
                                            }
                                            isDisabled={isLocationLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <ReactSelect
                                            options={cityOptions}
                                            value={
                                                cityOptions.find(
                                                    (o) => o.value === field.value
                                                ) ?? null
                                            }
                                            onChange={(option) =>
                                                field.onChange(option?.value ?? "")
                                            }
                                            placeholder={
                                                !selectedStateId
                                                    ? "Select a state first"
                                                    : isCitiesLoading
                                                      ? "Loading cities..."
                                                      : "Select city"
                                            }
                                            isDisabled={
                                                !selectedStateId || isCitiesLoading
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="gst_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>GST number (optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="15-character GSTIN" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contact_person"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact person (optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contact name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contact_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact number (optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="10-digit number"
                                            inputMode="numeric"
                                            maxLength={10}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/clients")}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="indigo"
                                disabled={createClientMutation.isPending}
                            >
                                Save client
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default ClientForm;
