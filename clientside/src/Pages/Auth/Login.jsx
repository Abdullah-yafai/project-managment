import React, { useState } from "react";
import FormInput from "../../Components/FormInput";
import Button from "../../Components/Button";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const [form, setForm] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // POST login
      // const res = await fetch("/api/auth/login", { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
      // const data = await res.json();
      // store token, redirect to dashboard
      console.log("Login payload", form);
      alert("Login simulated");
      // nav("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      <form onSubmit={submit}>
        <FormInput label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
        <FormInput label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
        <div className="flex justify-between items-center">
          <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          <a className="text-sm text-gray-600" href="/signup">Create account</a>
        </div>
      </form>
    </div>
  );
}
