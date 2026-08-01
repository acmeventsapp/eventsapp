"use client";

import { useEffect, useRef } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormTagInput from "@/components/custom/form-tag-input";
import {
  DEFAULT_EVENT_FORM_FIELDS,
  FORM_FIELD_TYPE_LABELS,
  fieldHasOptions,
  normalizeFieldOptions,
  slugifyFieldKey,
} from "@/lib/form-fields";
import type { EventFormValues } from "@/validators/schemas/event";
import type { FormFieldType } from "@prisma/client";

const FIELD_TYPES = Object.keys(FORM_FIELD_TYPE_LABELS) as FormFieldType[];
const NONE_DEPENDENCY_VALUE = "__none__";

function isParentFieldType(fieldType: FormFieldType) {
  return fieldType === "SELECT" || fieldType === "RADIO";
}

function ConditionalOptionsEditor({
  index,
  parentOptions,
}: {
  index: number;
  parentOptions: string[];
}) {
  const form = useFormContext<EventFormValues>();
  const conditionalOptions =
    form.watch(`formFields.${index}.conditionalOptions`) ?? {};

  function updateParentOptions(parentOption: string, options: string[]) {
    form.setValue(
      `formFields.${index}.conditionalOptions`,
      {
        ...conditionalOptions,
        [parentOption]: options,
      },
      { shouldValidate: true, shouldDirty: true }
    );
  }

  if (parentOptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add options to the parent field first, then map child options for each
        parent value.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {parentOptions.map((parentOption) => (
        <div key={parentOption} className="min-w-0 rounded-lg border p-3">
          <FormLabel className="mb-2 block">{parentOption}</FormLabel>
          <FormTagInput
            value={conditionalOptions[parentOption] ?? []}
            onChange={(options) => updateParentOptions(parentOption, options)}
            placeholder="Type an option and press Enter"
          />
        </div>
      ))}
    </div>
  );
}

export default function FormFieldBuilder() {
  const form = useFormContext<EventFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "formFields",
  });
  const fieldKeysManuallyEdited = useRef(new Set<string>());
  const hasSeededFieldKeys = useRef(false);
  const watchedFormFields = form.watch("formFields");

  useEffect(() => {
    if (hasSeededFieldKeys.current) return;
    hasSeededFieldKeys.current = true;

    fields.forEach((field, index) => {
      const label = form.getValues(`formFields.${index}.label`);
      const fieldKey = form.getValues(`formFields.${index}.fieldKey`);
      const autoKey = slugifyFieldKey(label);

      if (fieldKey && fieldKey !== autoKey) {
        fieldKeysManuallyEdited.current.add(field.id);
      }
    });
  }, [fields, form]);

  function addField() {
    append({
      label: "New question",
      fieldKey: `field_${fields.length + 1}`,
      fieldType: "TEXT",
      placeholder: "",
      helpText: "",
      required: true,
      options: [],
      dependsOn: null,
      conditionalOptions: null,
      sortOrder: fields.length,
    });
  }

  function restoreDefaults() {
    fieldKeysManuallyEdited.current.clear();
    hasSeededFieldKeys.current = false;
    form.setValue("formFields", DEFAULT_EVENT_FORM_FIELDS);
  }

  function getParentCandidates(currentIndex: number) {
    return (watchedFormFields ?? [])
      .map((field, candidateIndex) => ({ ...field, candidateIndex }))
      .filter(
        (field) =>
          field.candidateIndex !== currentIndex &&
          isParentFieldType(field.fieldType) &&
          !field.dependsOn
      );
  }

  function buildConditionalOptions(
    parentFieldKey: string,
    existing: Record<string, string[]> | null | undefined
  ) {
    const parentField = (watchedFormFields ?? []).find(
      (field) => field.fieldKey === parentFieldKey
    );
    const parentOptions = normalizeFieldOptions(parentField?.options ?? []);
    const next: Record<string, string[]> = {};

    parentOptions.forEach((option) => {
      next[option] = existing?.[option] ?? [];
    });

    return next;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base text-primary">Registration form fields</h3>
          <p className="text-sm text-muted-foreground">
            Build a custom guest registration form for this event.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={restoreDefaults}>
          Restore defaults
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No registration fields yet. Add a field or restore the default form.
        </div>
      ) : (
        fields.map((field, index) => {
          const fieldType = form.watch(`formFields.${index}.fieldType`);
          const dependsOn = form.watch(`formFields.${index}.dependsOn`);
          const showOptions = fieldHasOptions(fieldType);
          const showDependencyControls =
            fieldType === "SELECT" || fieldType === "RADIO";
          const parentCandidates = getParentCandidates(index);
          const selectedParent = dependsOn
            ? (watchedFormFields ?? []).find((item) => item.fieldKey === dependsOn)
            : null;
          const parentOptions = normalizeFieldOptions(selectedParent?.options ?? []);

          return (
            <div
              key={field.id}
              className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg border p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base text-primary">Field {index + 1}</h3>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`formFields.${index}.label`}
                  render={({ field: labelField }) => (
                    <FormItem>
                      <FormLabel>Question label</FormLabel>
                      <FormControl>
                        <Input
                          {...labelField}
                          onChange={(event) => {
                            labelField.onChange(event);
                            if (!fieldKeysManuallyEdited.current.has(field.id)) {
                              form.setValue(
                                `formFields.${index}.fieldKey`,
                                slugifyFieldKey(event.target.value),
                                { shouldValidate: true }
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`formFields.${index}.fieldType`}
                  render={({ field: typeField }) => (
                    <FormItem>
                      <FormLabel>Field type</FormLabel>
                      <Select
                        value={typeField.value}
                        onValueChange={(value) => {
                          typeField.onChange(value);
                          if (value !== "SELECT" && value !== "RADIO") {
                            form.setValue(`formFields.${index}.dependsOn`, null);
                            form.setValue(
                              `formFields.${index}.conditionalOptions`,
                              null
                            );
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {FORM_FIELD_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`formFields.${index}.fieldKey`}
                render={({ field: keyField }) => (
                  <FormItem>
                    <FormLabel>Field key</FormLabel>
                    <FormControl>
                      <Input
                        {...keyField}
                        onChange={(event) => {
                          fieldKeysManuallyEdited.current.add(field.id);
                          keyField.onChange(event);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`formFields.${index}.placeholder`}
                  render={({ field: placeholderField }) => (
                    <FormItem>
                      <FormLabel>Placeholder</FormLabel>
                      <FormControl>
                        <Input
                          {...placeholderField}
                          disabled={fieldType === "ORG_BRANCH"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`formFields.${index}.helpText`}
                  render={({ field: helpField }) => (
                    <FormItem>
                      <FormLabel>Help text</FormLabel>
                      <FormControl>
                        <Input {...helpField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {fieldType === "ORG_BRANCH" ? (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  Registrants will pick Zone → Unit → Branch from the Organization
                  hierarchy managed under Admin → Organization. No custom options
                  are needed.
                </p>
              ) : null}

              {showDependencyControls ? (
                <FormField
                  control={form.control}
                  name={`formFields.${index}.dependsOn`}
                  render={({ field: dependsOnField }) => (
                    <FormItem>
                      <FormLabel>Depends on</FormLabel>
                      <Select
                        value={dependsOnField.value ?? NONE_DEPENDENCY_VALUE}
                        onValueChange={(value) => {
                          if (value === NONE_DEPENDENCY_VALUE) {
                            dependsOnField.onChange(null);
                            form.setValue(
                              `formFields.${index}.conditionalOptions`,
                              null
                            );
                            return;
                          }

                          dependsOnField.onChange(value);
                          form.setValue(`formFields.${index}.options`, []);
                          form.setValue(
                            `formFields.${index}.conditionalOptions`,
                            buildConditionalOptions(
                              value,
                              form.getValues(`formFields.${index}.conditionalOptions`)
                            )
                          );
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="No dependency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_DEPENDENCY_VALUE}>
                            — none —
                          </SelectItem>
                          {parentCandidates.map((candidate) => (
                            <SelectItem
                              key={candidate.fieldKey}
                              value={candidate.fieldKey}
                            >
                              {candidate.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Link this field to a parent Select or Radio field to
                        filter its options.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {showOptions && !dependsOn ? (
                <FormField
                  control={form.control}
                  name={`formFields.${index}.options`}
                  render={({ field: optionsField }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Options</FormLabel>
                      <FormControl>
                        <FormTagInput
                          value={optionsField.value ?? []}
                          onChange={optionsField.onChange}
                          placeholder="Type an option and press Enter"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Add each choice separately. Press Enter after typing, or
                        click the × on a tag to remove it.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {showOptions && dependsOn ? (
                <FormItem className="min-w-0">
                  <FormLabel>Conditional options</FormLabel>
                  <ConditionalOptionsEditor
                    index={index}
                    parentOptions={parentOptions}
                  />
                  <p className="text-xs text-muted-foreground">
                    For each parent value, add the child options that should
                    appear when it is selected.
                  </p>
                  <FormMessage>
                    {form.formState.errors.formFields?.[index]?.conditionalOptions
                      ?.message as string | undefined}
                  </FormMessage>
                </FormItem>
              ) : null}

              <FormField
                control={form.control}
                name={`formFields.${index}.required`}
                render={({ field: requiredField }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={requiredField.value}
                        onCheckedChange={(checked) =>
                          requiredField.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <FormLabel>Required field</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          );
        })
      )}

      {form.formState.errors.formFields?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.formFields.message}
        </p>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={addField}
        className="self-start"
      >
        <Plus className="size-4" data-icon="inline-start" />
        Add field
      </Button>
    </div>
  );
}
