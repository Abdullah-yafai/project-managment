import React from "react";

export default function FormInput({ label, type="text", value, onChange, name, placeholder, required=false }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-medium text-gray-700">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}
