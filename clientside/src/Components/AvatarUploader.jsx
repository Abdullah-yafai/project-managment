import React from "react";

export default function AvatarUploader({ file, setFile }) {
  const onChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">Avatar (optional)</label>
      <div className="mt-2 flex items-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
          {file ? (
            <img src={URL.createObjectURL(file)} alt="avatar preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">No</div>
          )}
        </div>
        <div className="ml-4">
          <input type="file" accept="image/*" onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
