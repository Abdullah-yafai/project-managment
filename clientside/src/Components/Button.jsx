import React from "react";

export default function Button({ children, onClick, type="button", disabled=false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
    >
      {children}
    </button>
  );
}
