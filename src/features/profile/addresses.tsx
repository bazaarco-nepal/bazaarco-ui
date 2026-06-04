"use client";

import React, { useState } from "react";
import { Button, Icon, LandmarkAddress, Spinner, AppLink } from "@/components/ui";
import { pathFromScreen } from "@/config/routes";
import { useBz } from "@/components/common";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "@/hooks/use-addresses";
import {
  ADDRESS_LABEL_PRESETS,
  deliveryToSavePayload,
  formatAddressLine,
  isAddressComplete,
  savedAddressToDelivery,
} from "@/lib/saved-address";
import type { DeliveryLocation } from "@/lib/delivery-location";
import {
  DEFAULT_DELIVERY,
  isDeliverableCity,
  DELIVERY_AREA_MESSAGE,
} from "@/lib/delivery-location";
import type { SavedAddress } from "@/services/api/addresses";
import { ApiRequestError } from "@/services/api/http";

const emptyForm = (): { label: string; location: DeliveryLocation } => ({
  label: "Home",
  location: { ...DEFAULT_DELIVERY, city: "Kathmandu", area: "", landmark: "", postal: "" },
});

type SavedAddressPickerProps = {
  addresses: SavedAddress[];
  selectedId: string | null;
  useNew: boolean;
  onSelect: (addr: SavedAddress) => void;
  onUseNew: () => void;
  onManage?: () => void;
};

/** Checkout address book — pick a saved label or enter a new address. */
export function SavedAddressPicker({
  addresses,
  selectedId,
  useNew,
  onSelect,
  onUseNew,
  onManage,
}: SavedAddressPickerProps) {
  if (!addresses.length) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)" }}>
          Saved addresses
        </span>
        {onManage && (
          <button
            type="button"
            onClick={onManage}
            style={{
              background: "none",
              border: "none",
              color: "var(--blue)",
              fontWeight: 700,
              fontSize: ".8125rem",
              cursor: "pointer",
            }}
          >
            Manage
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {addresses.map((addr) => {
          const selected = !useNew && selectedId === addr.id;
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelect(addr)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "var(--r-md)",
                border: `1.5px solid ${selected ? "var(--blue)" : "var(--line-200)"}`,
                background: selected ? "var(--tint-blue-50)" : "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${selected ? "var(--blue)" : "var(--line-300)"}`,
                    background: selected ? "var(--blue)" : "#fff",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected && <Icon name="check" size={11} color="#fff" />}
                </span>
                <span style={{ fontWeight: 800, color: "var(--ink-900)" }}>{addr.label}</span>
                {addr.isDefault && (
                  <span style={{ fontSize: ".6875rem", fontWeight: 700, color: "var(--blue)" }}>
                    Default
                  </span>
                )}
              </div>
              <p style={{ margin: "4px 0 0 26px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                {formatAddressLine(addr)}
              </p>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onUseNew}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "12px 14px",
            borderRadius: "var(--r-md)",
            border: `1.5px dashed ${useNew ? "var(--blue)" : "var(--line-200)"}`,
            background: useNew ? "var(--tint-blue-50)" : "#fff",
            cursor: "pointer",
            fontWeight: 700,
            color: useNew ? "var(--blue)" : "var(--ink-600)",
          }}
        >
          + Deliver to a different address
        </button>
      </div>
    </div>
  );
}

export function AddressesPage() {
  const { nav, toast } = useBz();
  const { data: addresses = [], isLoading, isError } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setForm(emptyForm());
    setEditing("new");
  };

  const openEdit = (addr: SavedAddress) => {
    setForm({ label: addr.label, location: savedAddressToDelivery(addr) });
    setEditing(addr);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const save = async () => {
    if (!form.label.trim()) {
      toast("Choose a label (e.g. Home or Office)");
      return;
    }
    if (!isAddressComplete(form.location)) {
      toast("Complete city, area, and landmark");
      return;
    }
    if (!isDeliverableCity(form.location.city)) {
      toast(DELIVERY_AREA_MESSAGE);
      return;
    }
    try {
      const payload = deliveryToSavePayload(form.location, form.label, editing === "new");
      if (editing === "new") {
        await createAddress.mutateAsync(payload);
        toast("Address saved");
      } else if (editing && editing !== "new") {
        await updateAddress.mutateAsync({ id: editing.id, payload });
        toast("Address updated");
      }
      closeForm();
    } catch (e) {
      toast(e instanceof ApiRequestError ? e.message : "Could not save address");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast("Address removed");
      if (editing && editing !== "new" && editing.id === id) closeForm();
    } catch (e) {
      toast(e instanceof ApiRequestError ? e.message : "Could not remove address");
    }
  };

  const makeDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast("Default address updated");
    } catch (e) {
      toast(e instanceof ApiRequestError ? e.message : "Could not update default");
    }
  };

  const busy =
    createAddress.isPending ||
    updateAddress.isPending ||
    deleteAddress.isPending ||
    setDefault.isPending;

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 80px" }}>
      <AppLink
        href={pathFromScreen("profile")}
        onNavigate={() => nav("profile")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--ink-500)",
          fontWeight: 600,
          fontSize: ".875rem",
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        <Icon name="chevronLeft" size={16} /> Back to profile
      </AppLink>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Saved addresses
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
            Saved addresses — choose at checkout
          </p>
        </div>
        {!editing && addresses.length > 0 && addresses.length < 10 && (
          <Button variant="primary" size="sm" icon="plus" onClick={openNew}>
            Add
          </Button>
        )}
      </div>

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spinner />
        </div>
      )}

      {isError && (
        <p style={{ color: "var(--danger)", fontWeight: 600 }}>Could not load your addresses.</p>
      )}

      {!isLoading && !editing && addresses.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 20px",
            background: "var(--line-50)",
            borderRadius: "var(--r-lg)",
            border: "1px dashed var(--line-200)",
          }}
        >
          <Icon name="mapPin" size={36} color="var(--ink-300)" style={{ margin: "0 auto" }} />
          <p style={{ margin: "12px 0 16px", color: "var(--ink-500)" }}>
            No saved addresses yet. Add Home, Office, or other spots for faster checkout.
          </p>
          <Button variant="primary" icon="plus" onClick={openNew}>
            Add your first address
          </Button>
        </div>
      )}

      {!editing && addresses.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                background: "#fff",
                border: `1.5px solid ${addr.isDefault ? "var(--blue)" : "var(--line-200)"}`,
                borderRadius: "var(--r-lg)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: addr.isDefault ? "var(--tint-blue-50)" : "var(--line-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    name={addr.label.toLowerCase() === "office" ? "store" : "home"}
                    size={20}
                    color={addr.isDefault ? "var(--blue)" : "var(--ink-500)"}
                  />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, color: "var(--ink-900)" }}>{addr.label}</span>
                    {addr.isDefault && (
                      <span
                        style={{
                          fontSize: ".6875rem",
                          fontWeight: 800,
                          color: "var(--blue)",
                          background: "var(--tint-blue-50)",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: ".875rem",
                      color: "var(--ink-500)",
                      lineHeight: 1.45,
                    }}
                  >
                    {formatAddressLine(addr)}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line-100)",
                }}
              >
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void makeDefault(addr.id)}
                  >
                    Set as default
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => openEdit(addr)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void remove(addr.id)}
                  style={{ color: "var(--danger)" }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: "1.125rem", fontWeight: 800 }}>
            {editing === "new" ? "Add address" : "Edit address"}
          </h2>

          <label
            style={{
              fontSize: ".8125rem",
              fontWeight: 700,
              color: "var(--ink-700)",
              display: "block",
              marginBottom: 8,
            }}
          >
            Label
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {ADDRESS_LABEL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setForm((f) => ({ ...f, label: preset }))}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--r-full)",
                  border: `1.5px solid ${form.label === preset ? "var(--blue)" : "var(--line-200)"}`,
                  background: form.label === preset ? "var(--tint-blue-50)" : "#fff",
                  color: form.label === preset ? "var(--blue)" : "var(--ink-600)",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  cursor: "pointer",
                }}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Parents' house"
            style={{
              width: "100%",
              height: 44,
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              padding: "0 14px",
              marginBottom: 18,
              fontFamily: "var(--font-sans)",
            }}
          />

          <LandmarkAddress
            value={form.location}
            onChange={(location) => setForm((f) => ({ ...f, location }))}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Button variant="secondary" full disabled={busy} onClick={closeForm}>
              Cancel
            </Button>
            <Button
              variant="primary"
              full
              disabled={busy || !isDeliverableCity(form.location.city)}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save address"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
