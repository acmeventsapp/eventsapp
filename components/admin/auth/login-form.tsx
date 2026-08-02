"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { ButtonSpinner } from "@/components/custom/spinner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/data/admin-auth";
import { cn } from "@/lib/utils";
import {
  AdminLoginSchema,
  type AdminLoginValues,
} from "@/validators/schemas/admin-auth";
import Image from "next/image";

export default function AdminLoginForm() {
  const router = useRouter();

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginValues) {
    const result = await loginAdmin(values);
    if (!result.success) {
      toast.error(result.error ?? "Login failed");
      return;
    }
    toast.success("Welcome back");
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Image
            src="/images/acm_logo.png"
            alt="ACM Ugwuagba Arch"
            width={100}
            height={100}
            className="w-16 h-16 mx-auto"
          />
          <h5 className="text-2xl font-semibold text-center">Admin Login</h5>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <ButtonSpinner label="Signing in..." />
                ) : (
                  "Sign in"
                )}
              </Button>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex w-full justify-center",
                )}
              >
                Back to site
              </Link>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
