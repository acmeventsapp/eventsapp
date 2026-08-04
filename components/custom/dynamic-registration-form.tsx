"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/custom/imageuploader";
import OrgHierarchyPicker from "@/components/custom/org-hierarchy-picker";
import { isMultiValueField, normalizeFieldOptions } from "@/lib/form-fields";
import {
  buildDynamicRegistrationDefaults,
  buildDynamicRegistrationSchema,
  type DynamicRegistrationValues,
} from "@/validators/schemas/registration";
import { isOrgBranchValue } from "@/validators/schemas/organization";
import type { FormFieldUI } from "@/validators/types/form-field";

interface DynamicRegistrationFormProps {
  fields: FormFieldUI[];
  onSubmit: (values: DynamicRegistrationValues) => Promise<void>;
  children: React.ReactNode;
}

function useDependentOptions(field: FormFieldUI, control: Control<DynamicRegistrationValues>) {
  const parentValue = useWatch({
    control,
    name: field.dependsOn ?? "",
    disabled: !field.dependsOn,
  });

  return useMemo(() => {
    if (!field.dependsOn || typeof parentValue !== "string" || !parentValue) {
      return [];
    }

    return normalizeFieldOptions(field.conditionalOptions?.[parentValue] ?? []);
  }, [field.conditionalOptions, field.dependsOn, parentValue]);
}

function DependentSelectField({
  field,
  control,
  setValue,
}: {
  field: FormFieldUI;
  control: Control<DynamicRegistrationValues>;
  setValue: UseFormSetValue<DynamicRegistrationValues>;
}) {
  const options = useDependentOptions(field, control);
  const parentValue = useWatch({
    control,
    name: field.dependsOn ?? "",
    disabled: !field.dependsOn,
  });

  useEffect(() => {
    setValue(field.fieldKey, "");
  }, [field.fieldKey, parentValue, setValue]);

  return (
    <FormField
      control={control}
      name={field.fieldKey}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required ? <span className="text-red-500"> *</span> : ""}
          </FormLabel>
          <Select
            value={String(formField.value ?? "")}
            onValueChange={formField.onChange}
            disabled={!parentValue}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    parentValue
                      ? field.placeholder ?? "Select an option"
                      : "Select the parent field first"
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.helpText ? <FormDescription>{field.helpText}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DependentRadioField({
  field,
  control,
  setValue,
}: {
  field: FormFieldUI;
  control: Control<DynamicRegistrationValues>;
  setValue: UseFormSetValue<DynamicRegistrationValues>;
}) {
  const options = useDependentOptions(field, control);
  const parentValue = useWatch({
    control,
    name: field.dependsOn ?? "",
    disabled: !field.dependsOn,
  });

  useEffect(() => {
    setValue(field.fieldKey, "");
  }, [field.fieldKey, parentValue, setValue]);

  return (
    <FormField
      control={control}
      name={field.fieldKey}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required ? <span className="text-red-500"> *</span> : ""}
          </FormLabel>
          {!parentValue ? (
            <p className="text-sm text-muted-foreground">
              Select the parent field first to see available options.
            </p>
          ) : (
            <FormControl>
              <RadioGroup
                value={String(formField.value ?? "")}
                onValueChange={formField.onChange}
                className="gap-3"
              >
                {options.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                    <Label htmlFor={`${field.id}-${option}`} className="font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
          )}
          {field.helpText ? <FormDescription>{field.helpText}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function DynamicRegistrationForm({
  fields,
  onSubmit,
  children,
}: DynamicRegistrationFormProps) {
  const schema = useMemo(() => buildDynamicRegistrationSchema(fields), [fields]);
  const defaultValues = useMemo(() => buildDynamicRegistrationDefaults(fields), [fields]);

  const form = useForm<DynamicRegistrationValues>({
    resolver: zodResolver(schema as never),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {fields.map((field) => {
          if (field.dependsOn && field.fieldType === "SELECT") {
            return (
              <DependentSelectField
                key={field.id}
                field={field}
                control={form.control}
                setValue={form.setValue}
              />
            );
          }

          if (field.dependsOn && field.fieldType === "RADIO") {
            return (
              <DependentRadioField
                key={field.id}
                field={field}
                control={form.control}
                setValue={form.setValue}
              />
            );
          }

          if (field.fieldType === "ORG_BRANCH") {
            return (
              <FormField
                key={field.id}
                control={form.control}
                name={field.fieldKey}
                render={({ field: formField }) => (
                  <FormItem>
                    <fieldset className="min-w-0 border-0 p-0">
                      <legend className="sr-only">
                        {field.label}
                        {field.required ? " (required)" : ""}
                      </legend>
                      <FormControl>
                        <OrgHierarchyPicker
                          value={
                            isOrgBranchValue(formField.value) ? formField.value : null
                          }
                          onChange={formField.onChange}
                          required={field.required}
                        />
                      </FormControl>
                    </fieldset>
                    {field.helpText ? (
                      <FormDescription>{field.helpText}</FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          }

          const options = normalizeFieldOptions(field.options);
          const isMultiCheckbox = isMultiValueField(field);
          const isSingleCheckbox =
            field.fieldType === "CHECKBOX" && options.length === 0;

          return (
            <FormField
              key={field.id}
              control={form.control}
              name={field.fieldKey}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>
                    {field.label}
                    {field.required ? <span className="text-red-500"> *</span> : ""}
                  </FormLabel>

                  {field.fieldType === "TEXTAREA" ? (
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={field.placeholder ?? undefined}
                        value={String(formField.value ?? "")}
                        onChange={formField.onChange}
                      />
                    </FormControl>
                  ) : null}

                  {field.fieldType === "SELECT" ? (
                    <Select
                      value={String(formField.value ?? "")}
                      onValueChange={formField.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={field.placeholder ?? "Select an option"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  {field.fieldType === "RADIO" ? (
                    <FormControl>
                      <RadioGroup
                        value={String(formField.value ?? "")}
                        onValueChange={formField.onChange}
                        className="gap-3"
                      >
                        {options.map((option) => (
                          <div key={option} className="flex items-center gap-2">
                            <RadioGroupItem
                              value={option}
                              id={`${field.id}-${option}`}
                            />
                            <Label
                              htmlFor={`${field.id}-${option}`}
                              className="font-normal"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  ) : null}

                  {isMultiCheckbox ? (
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        {options.map((option) => {
                          const selected = Array.isArray(formField.value)
                            ? formField.value
                            : [];

                          return (
                            <label key={option} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={selected.includes(option)}
                                onCheckedChange={(checked) => {
                                  const next = checked
                                    ? [...selected, option]
                                    : selected.filter((value) => value !== option);
                                  formField.onChange(next);
                                }}
                              />
                              {option}
                            </label>
                          );
                        })}
                      </div>
                    </FormControl>
                  ) : null}

                  {isSingleCheckbox ? (
                    <FormItem className="flex flex-row items-center gap-3">
                      <FormControl>
                        <Checkbox
                          checked={Boolean(formField.value)}
                          onCheckedChange={(checked) =>
                            formField.onChange(checked === true)
                          }
                        />
                      </FormControl>
                      <FormLabel>{field.placeholder || "Yes"}</FormLabel>
                    </FormItem>
                  ) : null}

                  {["TEXT", "EMAIL", "PHONE"].includes(field.fieldType) ? (
                    <FormControl>
                      <Input
                        type={
                          field.fieldType === "EMAIL"
                            ? "email"
                            : field.fieldType === "PHONE"
                              ? "tel"
                              : "text"
                        }
                        placeholder={field.placeholder ?? undefined}
                        value={String(formField.value ?? "")}
                        onChange={formField.onChange}
                      />
                    </FormControl>
                  ) : null}

                  {field.fieldType === "NUMBER" ? (
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={field.placeholder ?? undefined}
                        value={String(formField.value ?? "")}
                        onChange={formField.onChange}
                      />
                    </FormControl>
                  ) : null}

                  {field.fieldType === "DATE" ? (
                    <FormControl>
                      <Input
                        type="date"
                        value={String(formField.value ?? "")}
                        onChange={formField.onChange}
                      />
                    </FormControl>
                  ) : null}

                  {field.fieldType === "IMAGE" ? (
                    <FormControl>
                      <ImageUploader
                        value={String(formField.value ?? "")}
                        onChange={formField.onChange}
                        label={field.label}
                        folder="asm-registrations/photos"
                        allowCamera
                        showUrlInput={false}
                        helperText={
                          field.required
                            ? "Upload a photo or take one with your camera"
                            : "Optional — upload a photo or take one with your camera"
                        }
                      />
                    </FormControl>
                  ) : null}

                  {field.helpText ? (
                    <FormDescription>{field.helpText}</FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}

        {children}
      </form>
    </Form>
  );
}
