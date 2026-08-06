"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import NumberInput from "@/components/custom/number-input";
import { Button } from "@/components/ui/button";
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
import type { EventFormValues } from "@/validators/schemas/event";

const NONE_FILTER_VALUE = "__none__";

export default function AssignmentGroupBuilder() {
  const form = useFormContext<EventFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "assignmentGroups",
  });
  const formFields = form.watch("formFields");

  const filterFieldOptions = useMemo(
    () =>
      (formFields ?? []).filter(
        (field) => field.fieldType === "SELECT" || field.fieldType === "RADIO"
      ),
    [formFields]
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base text-primary">Assignment groups</h3>
          <p className="text-sm text-muted-foreground">
            Optional. Attendees are randomly assigned to a group with available
            capacity when registration is confirmed. Use a filter to limit a
            group to registrants with a specific answer (e.g. Camp Section =
            Teenagers).
          </p>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No assignment groups configured. Attendees will not receive a group
          assignment.
        </div>
      ) : (
        fields.map((field, index) => {
          const selectedFilterKey = form.watch(
            `assignmentGroups.${index}.targetFieldKey`
          );
          const selectedFilterField = filterFieldOptions.find(
            (option) => option.fieldKey === selectedFilterKey
          );

          return (
            <div key={field.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base text-primary">Group {index + 1}</h3>
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
                  name={`assignmentGroups.${index}.name`}
                  render={({ field: nameField }) => (
                    <FormItem>
                      <FormLabel>Group name</FormLabel>
                      <FormControl>
                        <Input {...nameField} placeholder="Bible Study Class A" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`assignmentGroups.${index}.capacity`}
                  render={({ field: capacityField }) => (
                    <FormItem>
                      <FormLabel>Capacity (0 = unlimited)</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={capacityField.value}
                          onChange={capacityField.onChange}
                          min={0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-lg border border-dashed p-3">
                <p className="mb-3 text-sm font-medium text-primary">
                  Only assign registrants who answered…
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`assignmentGroups.${index}.targetFieldKey`}
                    render={({ field: filterField }) => (
                      <FormItem>
                        <FormLabel>Filter by field</FormLabel>
                        <Select
                          value={filterField.value || NONE_FILTER_VALUE}
                          onValueChange={(value) => {
                            if (value === NONE_FILTER_VALUE) {
                              filterField.onChange("");
                              form.setValue(
                                `assignmentGroups.${index}.targetFieldValue`,
                                ""
                              );
                              return;
                            }

                            filterField.onChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="No filter (all registrants)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE_FILTER_VALUE}>
                              No filter (all registrants)
                            </SelectItem>
                            {filterFieldOptions.map((option) => (
                              <SelectItem key={option.fieldKey} value={option.fieldKey}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedFilterKey ? (
                    <FormField
                      control={form.control}
                      name={`assignmentGroups.${index}.targetFieldValue`}
                      render={({ field: valueField }) => (
                        <FormItem>
                          <FormLabel>Required answer</FormLabel>
                          {selectedFilterField?.options?.length ? (
                            <Select
                              value={valueField.value || undefined}
                              onValueChange={valueField.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select required answer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedFilterField.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input
                                {...valueField}
                                placeholder="e.g. Teenagers"
                              />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() =>
          append({
            name: "",
            capacity: 0,
            targetFieldKey: "",
            targetFieldValue: "",
            sortOrder: fields.length,
          })
        }
      >
        <Plus className="size-4" data-icon="inline-start" />
        Add group
      </Button>
    </div>
  );
}
