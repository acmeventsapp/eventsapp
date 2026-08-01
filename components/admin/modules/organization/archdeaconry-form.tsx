"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ButtonSpinner } from "@/components/custom/spinner";
import { Button } from "@/components/ui/button";
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
import { useArchdeaconry, useUpsertArchdeaconry } from "@/hooks/use-organization";
import {
  ArchdeaconrySchema,
  type ArchdeaconryFormValues,
} from "@/validators/schemas/organization";

export default function ArchdeaconryForm() {
  const { data: archdeaconry, isLoading } = useArchdeaconry();
  const { mutateAsync: saveArchdeaconry, isLoading: isSaving } =
    useUpsertArchdeaconry();

  const form = useForm<ArchdeaconryFormValues>({
    resolver: zodResolver(ArchdeaconrySchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (archdeaconry) {
      form.reset({ name: archdeaconry.name });
    }
  }, [archdeaconry, form]);

  async function onSubmit(values: ArchdeaconryFormValues) {
    const result = await saveArchdeaconry(values);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save archdeaconry");
      return;
    }
    toast.success(archdeaconry ? "Archdeaconry updated" : "Archdeaconry created");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Archdeaconry</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                This system manages a single Archdeaconry. Zones, units, and
                branches nest under it.
              </p>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Archdeaconry name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Lagos Archdeaconry" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <ButtonSpinner label="Saving..." />
                ) : archdeaconry ? (
                  "Save changes"
                ) : (
                  "Create archdeaconry"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
