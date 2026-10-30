'use client';
import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
import Dashboard from '../components/Dashboard';
import Entry from '../components/Entry';
import Records from '../components/Records';

const TABS = [['dash', 'Dashboard'], ['entry', 'Data Entry'], ['rec', 'Production Records']];

function Login() {
  const [f, setF] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const go = async (signup) => {
    setMsg('');
    const { error } = signup ? await sb.auth.signUp(f) : await sb.auth.signInWithPassword(f);
    if (error) setMsg(error.message); else if (signup) setMsg('สมัครสำเร็จ — ตรวจอีเมลเพื่อยืนยัน (ถ้าเปิดใช้) แล้วเข้าสู่ระบบ');
  };
  return (
    <div className="min-h-screen grid place-items-center bg-navy-900 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold">FTR Management System</h1>
        <p className="text-sm text-slate-500">First Time Right – Quality Performance</p>
        <input className="inp" placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className="inp" placeholder="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {msg && <p className="text-sm text-red-600">{msg}</p>}
        <button className="btn w-full" onClick={() => go(false)}>Sign in</button>
        <button className="w-full text-sm underline" onClick={() => go(true)}>Create account</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('dash');
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return null;
  if (!session) return <Login />;
  return (
    <div className="min-h-screen">
      <header className="bg-navy-900 text-white px-4 py-3 flex flex-wrap items-center gap-4">
        <b className="text-lg">FTR Management</b>
        <nav className="flex gap-1 flex-1 flex-wrap">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-md text-sm ${tab === k ? 'bg-white text-navy-900 font-semibold' : 'hover:bg-navy-700'}`}>{l}</button>
          ))}
        </nav>
        <span className="text-xs opacity-70">{session.user.email}</span>
        <button className="text-sm underline" onClick={() => sb.auth.signOut()}>Sign out</button>
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        {tab === 'dash' && <Dashboard />}
        {tab === 'entry' && <Entry user={session.user} onSaved={() => setTab('rec')} />}
        {tab === 'rec' && <Records />}
      </main>
    </div>
  );
}
