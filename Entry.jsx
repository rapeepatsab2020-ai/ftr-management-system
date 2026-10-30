'use client';
import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
import { ftr, ftrColor, n } from '../lib/util';

const init = () => ({ rec_date: new Date().toISOString().slice(0, 10), shift: 'Day', plant: '', line_id: '', process_id: '', part_id: '',
  inspected_qty: '', first_time_good_qty: '', rework_qty: 0, scrap_qty: 0, defect_category_id: '', defect_description: '', operator: '', inspector: '', remark: '' });

export default function Entry({ user, onSaved }) {
  const [m, setM] = useState({ lines: [], procs: [], parts: [], cats: [] });
  const [f, setF] = useState(init());
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const q = (t) => sb.from(t).select('*').eq('is_active', true).order('created_at');
    Promise.all([q('production_lines'), q('processes'), q('parts'), q('defect_categories')]).then(([l, p, pt, c]) =>
      setM({ lines: l.data || [], procs: p.data || [], parts: pt.data || [], cats: c.data || [] }));
  }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const insp = n(f.inspected_qty), good = n(f.first_time_good_qty), ng = insp - good;
  const errs = [];
  if (insp <= 0) errs.push('Total Inspected ต้องมากกว่า 0');
  if (good > insp) errs.push('First Time Good ต้องไม่เกิน Total Inspected');
  if (n(f.rework_qty) + n(f.scrap_qty) > Math.max(ng, 0)) errs.push('Rework + Scrap ต้องไม่เกินจำนวน NG');
  if (!f.line_id || !f.process_id || !f.part_id) errs.push('เลือก Line / Process / Part ให้ครบ');

  const save = async () => {
    if (errs.length) return setMsg('❌ ' + errs[0]);
    const part = m.parts.find((p) => p.id === f.part_id);
    const row = { ...f, customer_id: part?.customer_id || null, inspected_qty: insp, first_time_good_qty: good, ng_qty: ng,
      rework_qty: n(f.rework_qty), scrap_qty: n(f.scrap_qty), defect_category_id: f.defect_category_id || null, created_by: user.id };
    const { error } = await sb.from('production_records').insert(row);
    if (error) return setMsg('❌ ' + error.message);
    setF(init()); onSaved();
  };
  const Sel = ({ k, label, opts, name }) => (
    <label className="block text-sm">{label}
      <select className="inp mt-1" value={f[k]} onChange={set(k)}><option value="">-- เลือก --</option>
        {opts.map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</select></label>
  );
  const Inp = ({ k, label, type = 'text' }) => (
    <label className="block text-sm">{label}<input className="inp mt-1" type={type} min="0" value={f[k]} onChange={set(k)} /></label>
  );
  const live = ftr(good, insp);
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
      <h2 className="text-lg font-bold">Data Entry</h2>
      {m.lines.length === 0 && <p className="text-sm bg-yellow-100 p-2 rounded">ยังไม่มี Master Data — เพิ่ม Line / Process / Part ใน Supabase ก่อน (ดู README)</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Inp k="rec_date" label="Date" type="date" />
        <label className="block text-sm">Shift<select className="inp mt-1" value={f.shift} onChange={set('shift')}><option>Day</option><option>Night</option></select></label>
        <Inp k="plant" label="Plant" />
        <Sel k="line_id" label="Production Line" opts={m.lines} name={(o) => o.name} />
        <Sel k="process_id" label="Process" opts={m.procs} name={(o) => o.name} />
        <Sel k="part_id" label="Part (No. / Name / Model)" opts={m.parts} name={(o) => `${o.part_no} – ${o.part_name} (${o.model || '-'})`} />
        <Inp k="inspected_qty" label="Total Inspected Qty" type="number" />
        <Inp k="first_time_good_qty" label="First Time Good Qty" type="number" />
        <Inp k="rework_qty" label="Rework Qty" type="number" />
        <Inp k="scrap_qty" label="Scrap Qty" type="number" />
        <Sel k="defect_category_id" label="Defect Category" opts={m.cats} name={(o) => o.name} />
        <Inp k="defect_description" label="Defect Description" />
        <Inp k="operator" label="Operator" />
        <Inp k="inspector" label="Inspector" />
        <Inp k="remark" label="Remark" />
      </div>
      <div className="flex flex-wrap items-center gap-6 border-t pt-4">
        <div>NG (auto): <b>{ng > 0 ? ng : 0}</b></div>
        <div>FTR: <b className="text-2xl" style={{ color: ftrColor(live) }}>{live.toFixed(2)}%</b></div>
        <button className="btn ml-auto" onClick={save}>Save record</button>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      {errs.length > 0 && insp > 0 && <p className="text-xs text-amber-700">{errs[0]}</p>}
    </div>
  );
}
