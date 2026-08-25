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
import { useCreateContact, useUpdateContact } from "@/lib/hooks/use-contacts";
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "@/lib/validations/contacts";
import { Contact, ContactPerson } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Plus, Trash2, User, PhoneCall, Car } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { usePermissions } from "@/lib/providers/permissions-provider";

interface ContactDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contact: Contact) => void;
  contactType?: "CUSTOMER" | "SUPPLIER";
  defaultIsIndividual?: boolean;
}

export function ContactDialog({
  contact,
  open,
  onOpenChange,
  onSuccess,
  contactType = "CUSTOMER",
  defaultIsIndividual = true,
}: ContactDialogProps) {
  const t = useTranslations("contacts");
  const tCommon = useTranslations("common");
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const { hasPermission } = usePermissions();

  const isEdit = !!contact;
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const canManageFinance = hasPermission("contacts:manage_finance");

  const effectiveType = contact?.type || contactType;
  const isSupplier = effectiveType === "SUPPLIER";

  const initialContactPersons = useMemo<ContactPerson[]>(() => {
    if (!contact?.contactPersons) return [];
    if (Array.isArray(contact.contactPersons)) return contact.contactPersons as ContactPerson[];
    try {
      const parsed = JSON.parse(contact.contactPersons as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [contact]);

  const defaultValues = useMemo(() => {
    if (!contact) {
      return {
        type: effectiveType,
        name: "",
        email: "",
        phone: "",
        address: "",
        binNumber: "",
        isIndividual: isSupplier ? false : defaultIsIndividual,
        creditLimit: 0,
        ...(canManageFinance && { balance: 0 }),
        vehicles: [],
        contactPersons: [],
      };
    }
    return {
      type: contact.type || effectiveType,
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      binNumber: contact.binNumber || "",
      isIndividual: isSupplier ? false : (contact.isIndividual ?? defaultIsIndividual),
      creditLimit: contact.creditLimit || 0,
      ...(canManageFinance && { balance: contact.balance || 0 }),
      vehicles: isSupplier
        ? []
        : contact.vehicles?.map((v) => ({
            id: v.id,
            vehicleNo: v.vehicleNo,
            vehicleType: v.vehicleType || "",
            driverName: v.driverName || "",
          })) || [],
      contactPersons: initialContactPersons,
    };
  }, [contact, effectiveType, isSupplier, defaultIsIndividual, canManageFinance, initialContactPersons]);

  const schema = isEdit ? updateContactSchema : createContactSchema;

  const form = useForm<CreateContactInput | UpdateContactInput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  const {
    fields: personFields,
    append: appendPerson,
    remove: removePerson,
  } = useFieldArray({
    control: form.control,
    name: "contactPersons" as any,
  });

  const isIndividual = useWatch({
    control: form.control,
    name: "isIndividual",
    defaultValue: isSupplier ? false : defaultIsIndividual,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const onSubmit = (data: CreateContactInput | UpdateContactInput) => {
    const payload = {
      ...data,
      type: effectiveType,
      isIndividual: isSupplier ? false : data.isIndividual,
      vehicles: isSupplier ? [] : data.vehicles,
    };

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
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2.5">
            {isSupplier ? (
              <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            ) : isIndividual ? (
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            )}
            {isSupplier
              ? isEdit
                ? "Edit Supplier"
                : "Create Supplier"
              : isIndividual
                ? isEdit
                  ? t("editContact")
                  : t("createContact")
                : isEdit
                  ? "Edit Company Customer"
                  : "Create Company Customer"}
          </DialogTitle>
          <DialogDescription>
            {isSupplier
              ? isEdit
                ? "Update supplier details and representative phone numbers."
                : "Add a new fuel or product supplier company to your directory."
              : isIndividual
                ? isEdit
                  ? t("editDescription")
                  : t("createDescription")
                : isEdit
                  ? "Update corporate customer details."
                  : "Add a new corporate customer account."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="px-6 py-4 space-y-4">
                {/* Individual Checkbox for Customers only */}
                {!isSupplier && !isEdit && (
                  <FormField
                    control={form.control}
                    name="isIndividual"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3.5 bg-muted/20">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-0.5 leading-none">
                          <FormLabel className="cursor-pointer font-medium">
                            {t("isIndividual")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("isIndividualDescription")}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {/* Main Name & Primary Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className={!isIndividual ? "sm:col-span-2" : ""}>
                        <FormLabel>
                          {isSupplier
                            ? "Supplier / Company Name"
                            : isIndividual
                              ? t("name")
                              : t("companyName")}{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              isSupplier
                                ? "e.g. Meghna Petroleum Ltd."
                                : isIndividual
                                  ? t("namePlaceholder")
                                  : t("companyNamePlaceholder")
                            }
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isIndividual && (
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("phone")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("phonePlaceholder")}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Email & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            value={field.value || ""}
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
                        <FormLabel>BIN / VAT Number (Optional)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("address")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={isSupplier ? "Office address, Street, City" : t("addressPlaceholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multiple Contact Persons / Additional Phones (Available for Suppliers and Companies) */}
                {(isSupplier || !isIndividual) && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <Label className="font-semibold text-sm">
                          Contact Persons & Phone Numbers
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => appendPerson({ name: "", phone: "", designation: "" })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Person / Phone
                      </Button>
                    </div>

                    {personFields.length === 0 && (
                      <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-md border border-dashed">
                        No additional contact persons added. Click "Add Person / Phone" to record representatives (e.g. Sales Manager, Accountant).
                      </p>
                    )}

                    {personFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex flex-col sm:flex-row items-end gap-2.5 bg-muted/30 p-3 rounded-lg border"
                      >
                        <FormField
                          control={form.control}
                          name={`contactPersons.${index}.name` as any}
                          render={({ field: inputField }) => (
                            <FormItem className="flex-1 w-full space-y-1">
                              <FormLabel className="text-xs">
                                Person Name <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Rafiqul Islam"
                                  className="h-8 text-sm"
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
                          name={`contactPersons.${index}.designation` as any}
                          render={({ field: inputField }) => (
                            <FormItem className="flex-1 w-full space-y-1">
                              <FormLabel className="text-xs">Designation / Role</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Sales Manager"
                                  className="h-8 text-sm"
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
                          name={`contactPersons.${index}.phone` as any}
                          render={({ field: inputField }) => (
                            <FormItem className="flex-1 w-full space-y-1">
                              <FormLabel className="text-xs">
                                Phone Number <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. 01712-345678"
                                  className="h-8 text-sm"
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
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 self-center sm:self-end mb-0.5"
                          onClick={() => removePerson(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Vehicles Section (Only for Customers) */}
                {!isSupplier && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <Label className="font-semibold text-sm">Customer Vehicles</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() =>
                          appendVehicle({ vehicleNo: "", vehicleType: "", driverName: "" })
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Vehicle
                      </Button>
                    </div>

                    {vehicleFields.length === 0 && (
                      <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-md border border-dashed">
                        No vehicles registered. Click "Add Vehicle" to assign plate numbers to this customer.
                      </p>
                    )}

                    {vehicleFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex flex-col sm:flex-row items-end gap-2.5 bg-muted/30 p-3 rounded-lg border"
                      >
                        <FormField
                          control={form.control}
                          name={`vehicles.${index}.vehicleNo`}
                          render={({ field: inputField }) => (
                            <FormItem className="flex-1 w-full space-y-1">
                              <FormLabel className="text-xs">
                                Vehicle No <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. DHAKA-METRO-1234"
                                  className="h-8 text-sm"
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
                          name={`vehicles.${index}.vehicleType`}
                          render={({ field: inputField }) => (
                            <FormItem className="flex-1 w-full space-y-1">
                              <FormLabel className="text-xs">Vehicle Type</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Truck / Bus"
                                  className="h-8 text-sm"
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
                            <FormItem className="flex-1 w-full space-y-1">
                              <FormLabel className="text-xs">Driver Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Anamul"
                                  className="h-8 text-sm"
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
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 self-center sm:self-end mb-0.5"
                          onClick={() => removeVehicle(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Financial Controls (Balance & Credit Limit) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                  {canManageFinance && (
                    <FormField
                      control={form.control}
                      name="balance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isSupplier ? "Initial Advance to Supplier" : t("balance")}
                          </FormLabel>
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
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Balance updates automatically with transactions and invoices.
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isSupplier ? "Credit Limit (Optional)" : t("creditLimit")}
                        </FormLabel>
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
