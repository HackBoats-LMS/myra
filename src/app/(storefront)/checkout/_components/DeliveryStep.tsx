"use client";
import { useEffect, useRef, useState } from "react";
import { normalizeIndianPhone } from "@/lib/phone";
import AddressForm from "./AddressForm";
import type { CheckoutAddress, CheckoutGift } from "./checkout-types";

interface DeliveryStepProps {
  addresses: CheckoutAddress[];
  phones: string[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  selectedPhone: string;
  setSelectedPhone: (phone: string) => void;
  isGift: boolean;
  setIsGift: (v: boolean) => void;
  gift: CheckoutGift;
  setGift: (g: CheckoutGift) => void;
  onAddressListChange: () => void;
}

const EMPTY_GIFT: CheckoutGift = {
  name: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export default function DeliveryStep({
  addresses,
  phones,
  selectedAddressId,
  setSelectedAddressId,
  selectedPhone,
  setSelectedPhone,
  isGift,
  setIsGift,
  gift,
  setGift,
  onAddressListChange,
}: DeliveryStepProps) {
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const addressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setIsAddressOpen(false);
      }
    }
    if (isAddressOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAddressOpen]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const hasNoAddresses = addresses.length === 0;

  const saveDeliveryPhone = (_phone: string) => {
    // Phone is kept in React state only — no localStorage persistence for PII.
  };

  const setGiftField = (key: keyof CheckoutGift, value: string) =>
    setGift({ ...gift, [key]: value });

  return (
    <div className="space-y-6">
      {/* Shipping Address */}
      <section className="bg-white border border-[#7A0B2E]/20 p-6 text-left space-y-4">
        <h3 className="text-base font-serif font-bold text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-3">
          Shipping Address
        </h3>

        {hasNoAddresses ? (
          <div className="bg-[#F5EFE6] border border-[#7A0B2E]/20 p-4 text-xs text-[#2D1F2F]">
            <p>You have no saved addresses. Add one below to continue.</p>
          </div>
        ) : (
          <div ref={addressRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAddressOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 bg-[#F5EFE6] border border-[#7A0B2E]/30 px-3.5 py-3 text-left focus:outline-none focus:border-[#7A0B2E] transition-colors rounded-none"
              aria-haspopup="listbox"
              aria-expanded={isAddressOpen}
            >
              <span className="min-w-0">
                {selectedAddress ? (
                  <>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E]">{selectedAddress.label}</span>
                      {selectedAddress.isDefault && (
                        <span className="text-[8px] font-bold uppercase tracking-widest bg-[#2D1F2F] text-white px-1.5 py-0.5">Default</span>
                      )}
                    </span>
                    <span className="block text-xs text-[#2D1F2F] truncate mt-1">
                      {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
                    </span>
                    {selectedAddress.phone && (
                      <span className="block text-[10px] text-[#7A0B2E] font-mono mt-0.5">{selectedAddress.phone}</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-500">Select a delivery address</span>
                )}
              </span>
              <i className={`ri-arrow-down-s-line text-lg text-[#7A0B2E] transition-transform ${isAddressOpen ? "rotate-180" : ""}`} />
            </button>

            {isAddressOpen && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-full mt-2 z-20 bg-white border border-[#7A0B2E]/20 shadow-xl max-h-64 overflow-y-auto rounded-none"
              >
                {addresses.map((a) => {
                  const isSelected = a.id === selectedAddressId;
                  return (
                    <li key={a.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(a.id);
                          if (phones.length === 0) {
                            const p = normalizeIndianPhone(a.phone);
                            setSelectedPhone(p);
                            saveDeliveryPhone(p);
                          }
                          setIsAddressOpen(false);
                        }}
                        className={`w-full flex items-start justify-between gap-3 px-3.5 py-3 text-left border-b border-[#7A0B2E]/10 last:border-b-0 transition-colors rounded-none ${isSelected ? "bg-[#7A0B2E]/10" : "hover:bg-[#F5EFE6]"}`}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F]">{a.label}</span>
                            {a.isDefault && (
                              <span className="text-[8px] font-bold uppercase tracking-widest bg-[#2D1F2F] text-white px-1.5 py-0.5">Default</span>
                            )}
                          </span>
                          <span className="block text-xs text-gray-600 mt-0.5">
                            {a.addressLine1}, {a.city}, {a.state} - {a.postalCode}
                          </span>
                          {a.phone && <span className="block text-[10px] text-[#7A0B2E] font-mono mt-0.5">{a.phone}</span>}
                        </span>
                        <span className={`flex-shrink-0 mt-0.5 ${isSelected ? "text-[#7A0B2E]" : "text-transparent"}`}>
                          <i className="ri-check-line text-lg" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setIsAddressOpen(false);
          }}
          className="text-[10px] font-bold text-[#7A0B2E] hover:text-[#2D1F2F] uppercase tracking-widest transition-colors flex items-center gap-1.5"
        >
          <i className="ri-add-line text-sm" />
          Add New Address
        </button>

        {showAddForm && (
          <AddressForm
            onSaved={() => {
              setShowAddForm(false);
              onAddressListChange();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </section>

      {/* Delivery Contact */}
      <section className="bg-white border border-[#7A0B2E]/20 p-6 text-left space-y-3">
        <h3 className="text-base font-serif font-bold text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-3">
          Delivery Contact
        </h3>
        <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={selectedPhone}
            onChange={(e) => {
              const v = normalizeIndianPhone(e.target.value);
              setSelectedPhone(v);
              saveDeliveryPhone(v);
              setPhoneError("");
            }}
            placeholder="e.g. 9876543210"
            className={`w-full px-3 py-2 text-xs focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F] rounded-none border ${phoneError ? "border-red-400" : "border-[#7A0B2E]/30"}`}
          />
        <p className="text-[10px] text-gray-500 leading-relaxed">We use this number to confirm and deliver your order.</p>
        {phoneError && <p className="text-[11px] text-red-600 font-medium">{phoneError}</p>}
      </section>
    </div>
  );
}
