// src/pages/SignupOrg.jsx
// Updated: conditional fields based on createOrg checkbox
// Dependencies: react-hook-form, yup, @hookform/resolvers

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const slugify = (s) =>
  s
    .toString()
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// mock orgs + departments for "join existing org" flow
const MOCK_ORGS = [
  { _id: "org1", name: "Abdullah Enterprise" },
  { _id: "org2", name: "Acme Corp" },
];
const DEPTS_BY_ORG = {
  org1: [
    { _id: "d1", name: "Web" },
    { _id: "d2", name: "Mobile" },
    { _id: "d3", name: "HR" },
  ],
  org2: [
    { _id: "d4", name: "Product" },
    { _id: "d5", name: "Ops" },
  ],
};

// schema: conditional rules
const schema = yup.object({
  createOrg: yup.boolean().required(),
  // when creating org -> orgName required, else org required
  orgName: yup.string().when("createOrg", {
    is: true,
    then: (schema) => schema.trim().min(3, "Org name too short").required("Organization name required"),
    otherwise: (schema) => schema.trim().nullable(),
  }),
  billingEmail: yup.string().when("createOrg", {
    is: true,
    then: (schema) => schema.trim().email("Invalid email").nullable(),
    otherwise: (schema) => schema.trim().nullable(),
  }),
  plan: yup.string().oneOf(["free", "pro"]).when("createOrg", {
    is: true,
    then: (s) => s.required(),
    otherwise: (s) => s.nullable(),
  }),
  // If not creating org -> require selecting existing org
  org: yup.string().when("createOrg", {
    is: false,
    then: (s) => s.required("Organization required to join"),
    otherwise: (s) => s.nullable(),
  }),
  // department required when joining an existing org
  department: yup.string().when("createOrg", {
    is: false,
    then: (s) => s.required("Department required"),
    otherwise: (s) => s.nullable(),
  }),
  // role required when joining existing org, but auto-owner when creating org
  role: yup.string().when("createOrg", {
    is: false,
    then: (s) => s.required("Role required"),
    otherwise: (s) => s.oneOf(["owner"]).nullable(),
  }),
  name: yup.string().trim().required("Full name required"),
  email: yup.string().trim().email("Invalid email").required("Email required"),
  password: yup.string().min(8, "Minimum 8 characters").required("Password required"),
  confirmPassword: yup.string().oneOf([yup.ref("password"), null], "Passwords must match").required("Confirm password"),
  terms: yup.boolean().oneOf([true], "Accept terms to continue"),
});

export default function SignupOrg() {
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [slugPreview, setSlugPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      createOrg: true,
      orgName: "",
      billingEmail: "",
      plan: "free",
      org: "",
      department: "",
      role: "owner", // default owner when creating org
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const createOrg = watch("createOrg");
  const orgName = watch("orgName");
  const selectedOrg = watch("org");

  // slug preview for org creation
  useEffect(() => {
    if (orgName && orgName.trim().length) setSlugPreview(slugify(orgName));
    else setSlugPreview("");
  }, [orgName]);

  // when createOrg toggles, set role default and clear department/org as needed
  useEffect(() => {
    if (createOrg) {
      setValue("role", "owner");
      setValue("org", "");
      setValue("department", "");
    } else {
      // joining existing org -> default role employee (but form requires selection)
      setValue("role", "employee");
      setValue("orgName", "");
      setValue("billingEmail", "");
      setValue("plan", "free");
    }
  }, [createOrg, setValue]);

  // preview avatar
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  // load departments when selectedOrg changes (mock here)
  const [departments, setDepartments] = useState([]);
  useEffect(() => {
    if (selectedOrg) {
      setDepartments(DEPTS_BY_ORG[selectedOrg] || []);
    } else {
      setDepartments([]);
    }
    // reset department field on org change
    setValue("department", "");
  }, [selectedOrg, setValue]);

  const onAvatarChange = (file) => {
    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Max avatar size 5MB");
      return;
    }
    setAvatarFile(file);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Build FormData ready for backend
      const fd = new FormData();

      fd.append("createOrg", data.createOrg ? "true" : "false");

      if (data.createOrg) {
        fd.append("orgName", data.orgName.trim());
        if (data.billingEmail) fd.append("billingEmail", data.billingEmail.trim());
        fd.append("plan", data.plan || "free");
        fd.append("role", "owner"); // explicit
        // optional slug preview
        fd.append("orgSlug", slugify(data.orgName || ""));
      } else {
        // joining existing org
        fd.append("org", data.org);
        fd.append("department", data.department);
        fd.append("role", data.role);
      }

      fd.append("name", data.name.trim());
      fd.append("email", data.email.trim());
      fd.append("password", data.password);

      if (avatarFile) fd.append("avatar", avatarFile);

      // for dev: show entries
      console.log("=== FormData ready to send ===");
      for (const pair of fd.entries()) {
        if (pair[1] instanceof File) console.log(pair[0], pair[1].name);
        else console.log(pair[0], pair[1]);
      }

      // TODO: replace with real API call:
      // const res = await fetch("/api/auth/signup", { method: "POST", body: fd });
      // const result = await res.json();

      alert("Form ready (check console). Replace with POST to /api/auth/signup");
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: Branding / Visual */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="1.2" />
                  <path d="M7 12h10" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold">TeamFlow</div>
                <div className="text-xs opacity-90">Project & task management</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Create organization & account</h2>
            <p className="text-sm opacity-90 mb-6">Quickly create a workspace for your team. You will become the organization owner.</p>

            <ul className="text-sm space-y-3">
              <li>• Public signup — create org instantly</li>
              <li>• Owner role assigned automatically</li>
              <li>• Avatar upload & profile setup</li>
            </ul>
          </div>

          <div className="text-sm opacity-90">
            <div>Have an existing workspace?</div>
            <div className="mt-2">
              <a href="/login" className="underline text-white">Sign in</a>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-6 md:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Get started</h3>
              <div className="text-sm text-gray-500">Public signup</div>
            </div>

            {/* createOrg toggle */}
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="createOrg"
                render={({ field }) => (
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Create a new organization (you will be owner)</span>
                  </label>
                )}
              />
            </div>

            {/* If creating org -> show orgName, billingEmail, plan, slug preview */}
            {createOrg ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization name *</label>
                  <input
                    {...register("orgName")}
                    placeholder="Acme Corporation"
                    className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                      errors.orgName ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                    }`}
                  />
                  {errors.orgName && <p className="text-xs text-red-600 mt-1">{errors.orgName.message}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing email (optional)</label>
                    <input
                      {...register("billingEmail")}
                      placeholder="billing@company.com"
                      className={`w-full rounded-lg border px-4 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                        errors.billingEmail ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                      }`}
                    />
                    {errors.billingEmail && <p className="text-xs text-red-600 mt-1">{errors.billingEmail.message}</p>}
                  </div>

                  <div style={{ minWidth: 120 }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                    <select
                      {...register("plan")}
                      className="w-full rounded-lg border px-3 py-2 text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-indigo-400"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Slug preview:</strong>{" "}
                  <span className="font-medium text-gray-800">{slugPreview || <em className="text-gray-400">type org name to preview</em>}</span>
                </div>
              </div>
            ) : (
              // joining an existing org -> show org select, department select, role select
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                  <select
                    {...register("org")}
                    className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                      errors.org ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                    }`}
                  >
                    <option value="">Choose organization</option>
                    {MOCK_ORGS.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  {errors.org && <p className="text-xs text-red-600 mt-1">{errors.org.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <select
                      {...register("department")}
                      className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                        errors.department ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                      }`}
                    >
                      <option value="">Choose department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      {...register("role")}
                      className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                        errors.role ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                      }`}
                    >
                      <option value="">Choose role</option>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                    {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Personal account fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                <input
                  {...register("name")}
                  placeholder="Your full name"
                  className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                    errors.name ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@company.com"
                  className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                    errors.email ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                  }`}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Min 8 characters"
                  className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                    errors.password ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                  }`}
                />
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password *</label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Repeat password"
                  className={`w-full rounded-lg border px-4 py-2 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-indigo-400"
                  }`}
                />
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* avatar row */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                {previewUrl ? <img src={previewUrl} alt="avatar preview" className="w-full h-full object-cover" /> : <div className="text-gray-400 text-xs">No avatar</div>}
              </div>

              <div className="flex-1">
                <div className="flex gap-3 items-center">
                  <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer text-sm shadow-sm hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <span className="text-gray-700">Upload avatar</span>
                  </label>

                  {avatarFile && (
                    <button type="button" onClick={() => setAvatarFile(null)} className="text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG/JPG — recommended max 2MB • Square images work best</p>
              </div>
            </div>

            {/* terms */}
            <div className="flex items-start gap-3">
              <input {...register("terms")} type="checkbox" className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              <div className="text-sm text-gray-600">
                I agree to the <a href="#" className="text-indigo-600 underline">Terms & Conditions</a>.
              </div>
            </div>
            {errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}

            {/* submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Creating..." : createOrg ? "Create organization & account" : "Join organization & create account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
