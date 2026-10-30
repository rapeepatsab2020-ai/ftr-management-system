'use client';
import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
import { ftrColor, fmt } from '../lib/util';

export default function Records() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    sb.from('production_records').select('*, production_lines(name), processes(name), parts(part_no)')
      .order('rec_date', { ascending: false }).order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setRows(data || []));
  }, []);
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm overflow-x-auto">
      <h2 className="text-lg font-bold mb-3">Production Records (ล่าสุด 200 รายการ)</h2>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b">{['Date', 'Shift', 'Line', 'Process', 'Part', 'Inspected', 'FT Good', 'NG', 'Rework', 'Scrap', 'FTR %'].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-b">
            <td className="py-1.5 pr-3">{r.rec_date}</td><td>{r.shift}</td><td>{r.production_lines?.name}</td><td>{r.processes?.name}</td><td>{r.parts?.part_no}</td>
            <td>{fmt(r.inspected_qty)}</td><td>{fmt(r.first_time_good_qty)}</td><td>{fmt(r.ng_qty)}</td><td>{fmt(r.rework_qty)}</td><td>{fmt(r.scrap_qty)}</td>
            <td className="font-bold" style={{ color: ftrColor(r.ftr_pct) }}>{r.ftr_pct}</td>
          </tr>))}
          {rows.length === 0 && <tr><td colSpan="11" className="py-6 text-center text-slate-500">ยังไม่มีข้อมูล — ไปที่ Data Entry เพื่อบันทึกรายการแรก</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
