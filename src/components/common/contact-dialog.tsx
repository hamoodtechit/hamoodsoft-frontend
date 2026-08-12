"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContacts, useCreateContact, useUpdateContact } from "@/lib/hooks/use-contacts";
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "@/lib/validations/contacts";
import { Contact } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Plus, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";

interface ContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contact: Contact) => void;
  defaultIsIndividual?: boolean;
}

export function ContactDialog({
  contact,
  open,
  onOpenChange,
  onSuccess,
  defaultIsIndividual = true,
}: ContactDialogProps) {
  const t = useTranslations("contacts");
  const tCommon = useTranslations("common");
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  const isEdit = !!contact;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const schema = isEdit ? updateContactSchema : createContactSchema;

  const defaultValues = useMemo(() => {
    if (!contact) {
      return {
        type: "CUSTOMER" as const,
        name: "",
        email: "",
        phone: "",
        address: "",
        binNumber: "",
        isIndividual: defaultIsIndividual,
        balance: 0,
        creditLimit: 0,
        vehicles: [],
      };
    }
    return {
      type: contact.type || ("CUSTOMER" as const),
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      binNumber: contact.binNumber || "",
      isIndividual: contact.isIndividual ?? defaultIsIndividual,
      balance: contact.balance || 0,
      creditLimit: contact.creditLimit || 0,
      vehicles: contact.vehicles?.map(v => ({ id: v.id, vehicleNo: v.vehicleNo, driverName: v.driverName || "" })) || [],
    };
  }, [contact, defaultIsIndividual]);

  const form = useForm<CreateContactInput | UpdateContactInput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  // Watch isIndividual to conditionally show/hide company fields
  const isIndividual = useWatch({
    control: form.control,
    name: "isIndividual",
    defaultValue: defaultIsIndividual,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  // Clear vehicleNo when switching? Not needed.
  useEffect(() => {
  }, [isIndividual, form]);

  const onSubmit = (data: CreateContactInput | UpdateContactInput) => {
    const payload = { ...data };

    if (isEdit && contact) {
      updateMutation.mutate(
        { id: contact.id, data: payload as UpdateContactInput },
        {
          onSuccess: (updatedContact) => {
            onOpenChange(false);
            onSuccess?.(updatedContact);
          },
        },
      );
      return;
    }

    createMutation.mutate(payload as CreateContactInput, {
      onSuccess: (newContact) => {
        onOpenChange(false);
        form.reset(defaultValues);
        onSuccess?.(newContact);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {isIndividual ? (
              <User className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
            {isIndividual
              ? isEdit
                ? t("editContact")
                : t("createContact")
              : isEdit
                ? "Edit Company"
                : "Create Company"}
          </DialogTitle>
          <DialogDescription>
            {isIndividual
              ? isEdit
                ? t("editDescription")
                : t("createDescription")
              : isEdit
                ? "Edit company details."
                : "Add a new company or select an existing company."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <ScrollArea className="h-[calc(90vh-220px)]">
              <div className="px-6 pb-6 space-y-4">
                {!isEdit && (
                  <FormField
                    control={form.control}
                    name="isIndividual"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t("isIndividual")}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t("isIndividualDescription")}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("type")} <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CUSTOMER">
                              {t("typeCustomer")}
                            </SelectItem>
                            <SelectItem value="SUPPLIER">
                              {t("typeSupplier")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isIndividual ? t("name") : t("companyName")}{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isIndividual ? t("namePlaceholder") : t("companyNamePlaceholder")}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Vehicles</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => append({ vehicleNo: "", driverName: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vehicle
                    </Button>
                  </div>
                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No vehicles added.</p>
                  )}
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 bg-muted/30 p-2 rounded-md border">
                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.vehicleNo`}
                        render={({ field: inputField }) => (
                          <FormItem className="flex-1 space-y-1">
                            <FormLabel className="text-xs">Vehicle No <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. DHAKA-METRO-1234"
                                {...inputField}
                                value={inputField.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.driverName`}
                        render={({ field: inputField }) => (
                          <FormItem className="flex-1 space-y-1">
                            <FormLabel className="text-xs">Driver Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Anam"
                                {...inputField}
                                value={inputField.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("email")}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t("emailPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("phone")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("phonePlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("address")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("addressPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="binNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BIN Number (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 123456789"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>



                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("balance")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              disabled={isEdit}
                              className={
                                isEdit && (field.value || 0) < 0
                                  ? "text-destructive border-destructive"
                                  : ""
                              }
                            />
                            {isEdit && (field.value || 0) < 0 && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-destructive">
                                (Owes)
                              </span>
                            )}
                            {isEdit && (field.value || 0) > 0 && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">
                                (Advance)
                              </span>
                            )}
                          </div>
                        </FormControl>
                        {isEdit && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Balance is system-managed based on sales and
                            payments.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("creditLimit")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {tCommon("loading")}
                  </>
                ) : (
                  tCommon("save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
