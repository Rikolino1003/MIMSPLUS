// src/components/Table.jsx
import React from "react";

export default function Table({ columns, data }) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-medium text-slate-600"
              >
                {col.title}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-slate-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              <td className="px-4 py-3 text-sm text-slate-700"> {/* acciones se proveen por quien use la tabla */} </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
