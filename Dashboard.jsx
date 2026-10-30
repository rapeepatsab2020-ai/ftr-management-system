'use client';
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { sb } from '../lib/supabase';
import { ftr, ftrColor, fmt, n, TARGET } from '../lib/util';

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');

function group(rows, keyFn) {
  const g = {};
  rows.forEach((r) => {
    const k = keyFn(r) || '-';
    g[k] ||= { name: k, insp: 0, good: 0, ng: 0, rw: 0, sc: 0 };
    g[k].insp += n(r.inspected_qty); g[k].good += n(r.first_time_good_qty); g[k].ng += n(r.ng_qty); g[k].rw += n(r.rework_qty); g[k].sc += n(r.scrap_qty);
  });
  return Object.values(g).map((x) => ({ ...x, ftr: ftr(x.good, x.insp) })).sort((a, b) => a.name.localeCompare(b.name));
}

function Kpi({ label, value, color }) {
  return <div className="bg-white rounded-xl p-4 shadow-sm border-l-4" style={{ borderColor: color || '#0b1f3a' }}>
    <div className="text-xs text-slate-500">{label}</div><div className="text-2xl font-bold" style={{ color }}>{value}</div></div>;
}
function Card({ title, children }) {
  return <div className="bg-white rounded-xl p-4 shadow-sm"><h3 className="font-semibold mb-2">{title}</h3><div style={{ height: 240 }}>{children}</div></div>;
}
function FtrBar({ data }) {
  return <ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} />
    <Tooltip /><ReferenceLine y={TARGET} stroke="#16a34a" strokeDasharray="4 4" />
    <Bar dataKey="ftr" name="FTR %">{data.map((d, i) => <Cell key={i} fill={ftrColor(d.ftr)} />)}</Bar></BarChart></ResponsiveContainer>;
}

export default function Dashboard() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ from: firstDay, to: today.toLocaleDateString('en-CA'), line: '', process: '', part: '', customer: '', shift: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      let all = [], from = 0;
      for (;;) {
        const { data } = await sb.from('production_records')
          .select('*, production_lines(name), processes(name), parts(part_no), customers(name)')
          .gte('rec_date', f.from).lte('rec_date', f.to).order('rec_date').range(from, from + 999);
        all = all.concat(data || []);
        if (!data || data.length < 1000) break;
        from += 1000;
      }
      setRaw(all); setLoading(false);
    })();
  }, [f.from, f.to]);

  const rows = useMemo(() => raw.filter((r) =>
    (!f.line || r.production_lines?.name === f.line) && (!f.process || r.processes?.name === f.process) &&
    (!f.part || r.parts?.part_no === f.part) && (!f.customer || r.customers?.name === f.customer) && (!f.shift || r.shift === f.shift)), [raw, f]);
  const opts = (fn) => [...new Set(raw.map(fn).filter(Boolean))].sort();
  const tot = group(rows, () => 'all')[0] || { insp: 0, good: 0, ng: 0, rw: 0, sc: 0, ftr: 0 };
  const daily = group(rows, (r) => r.rec_date), monthly = group(rows, (r) => r.rec_date.slice(0, 7));
  const byLine = group(rows, (r) => r.production_lines?.name), byProc = group(rows, (r) => r.processes?.name), byPart = group(rows, (r) => r.parts?.part_no);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const Sel = ({ k, label, list }) => <select className="inp" value={f[k]} onChange={set(k)}><option value="">{label}: ทั้งหมด</option>{list.map((x) => <option key={x}>{x}</option>)}</select>;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-white p-3 rounded-xl shadow-sm">
        <input type="date" className="inp" value={f.from} onChange={set('from')} /><input type="date" className="inp" value={f.to} onChange={set('to')} />
        <Sel k="line" label="Line" list={opts((r) => r.production_lines?.name)} /><Sel k="process" label="Process" list={opts((r) => r.processes?.name)} />
        <Sel k="part" label="Part" list={opts((r) => r.parts?.part_no)} /><Sel k="customer" label="Customer" list={opts((r) => r.customers?.name)} />
        <Sel k="shift" label="Shift" list={['Day', 'Night']} />
      </div>
      {loading ? <p>Loading…</p> : <>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
          <Kpi label="Total Production" value={fmt(tot.insp)} /><Kpi label="First Time Good" value={fmt(tot.good)} color="#16a34a" />
          <Kpi label="NG" value={fmt(tot.ng)} color="#dc2626" /><Kpi label="Rework" value={fmt(tot.rw)} color="#eab308" />
          <Kpi label="Scrap" value={fmt(tot.sc)} color="#dc2626" /><Kpi label={`Overall FTR (target ${TARGET}%)`} value={tot.ftr.toFixed(2) + '%'} color={ftrColor(tot.ftr)} />
        </div>
        {rows.length === 0 && <p className="text-slate-500 text-center py-6">ไม่มีข้อมูลในช่วงที่เลือก</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Daily FTR Trend"><ResponsiveContainer><LineChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><ReferenceLine y={TARGET} stroke="#16a34a" strokeDasharray="4 4" /><Line dataKey="ftr" name="FTR %" stroke="#12305a" strokeWidth={2} /></LineChart></ResponsiveContainer></Card>
          <Card title="Monthly FTR Trend"><FtrBar data={monthly} /></Card>
          <Card title="FTR by Production Line"><FtrBar data={byLine} /></Card>
          <Card title="FTR by Process"><FtrBar data={byProc} /></Card>
          <Card title="FTR by Part Number"><FtrBar data={byPart} /></Card>
        </div>
      </>}
    </div>
  );
}
