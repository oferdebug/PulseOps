"use client";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormLabel,
  FormControl,
  FormItem,
  FormMessage,
  FormField,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";

export default function LoginPage() {
  const form = useForm<FieldValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      ConfirmPassword: "",
    },
  });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FieldValues) => {
    if (data.password !== data.ConfirmPassword) {
      setError("Passwords Do Not Match");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  };
  return (
    <>
      <Card className="w-[400px] bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="space-y-2">
          <Logo />
          <CardTitle className="text-white">Register To PulseOps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-white font-medium">
                      Full Name
                    </FormLabel>
                    <FormDescription className="text-white/70">
                      Please enter your Full Name
                    </FormDescription>
                    <FormControl>
                      <Input
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        type="text"
                        placeholder="Enter your Full Name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <br />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70" htmlFor="email">
                      Email
                    </FormLabel>
                    <FormDescription className="text-white/70">
                      Please enter your email
                    </FormDescription>
                    <FormControl>
                      <Input
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        type="email"
                        {...field}
                        placeholder="your@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <br />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70" htmlFor="password">
                      Password
                    </FormLabel>
                    <FormDescription className="text-white/70">
                      Please enter your Password
                    </FormDescription>
                    <FormControl>
                      <Input
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        type="password"
                        placeholder="Enter your Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <br />
              <FormField
                control={form.control}
                name="ConfirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white" htmlFor="ConfirmPassword">
                      Confirm Password
                    </FormLabel>
                    <FormDescription className="text-white/70">
                      Please enter your Confirm Password
                    </FormDescription>
                    <FormControl>
                      <Input
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        type="password"
                        placeholder="Enter your Confirm Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <br />
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Register
              </Button>
            </form>
          </Form>
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 text-sm mt-4 block text-center"
          >
            Login to your account
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
