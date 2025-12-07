import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "@/controllers/users";
import { useAuth } from "@/hooks/authProvider";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
const schema = yup.object({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});
const Signin = () => {
  const { setToken } = useAuth();
  const [isSubmiting, setIsSubmiting] = useState(false);
  const navigate = useNavigate();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const onSubmit = async (data) => {
    setIsSubmiting(true);
    try {
      const res = await signIn(data);
      if (res.token) {
        setToken(res.token);
        toast.success("Signed in successfully");
        navigate("/");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("Invalid credentials");
    } finally {
      setIsSubmiting(false);
    }
  };
  return (
    <>
      <div className="w-full max-h-dvh">
        <div className="mx-auto w-[350px] flex flex-col items-center justify-center mt-10 space-y-5">
          <img
            src={`/logo.png`}
            className="size-40 rounded-full"
          />
          <div className="font-bold text-gray-700 text-2xl">
            Sign in to Jakkash
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 w-full"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input className="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isSubmiting} isLoading={isSubmiting} loadingText="Signing in...">
                Signin
              </Button>
            </form>{" "}
          </Form>
        </div>
      </div>
    </>
  );
};

export default Signin;
