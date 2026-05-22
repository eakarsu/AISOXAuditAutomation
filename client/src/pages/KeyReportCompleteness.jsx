import { useEffect, useState } from 'react';

export default function KeyReportCompleteness() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/key-report-completeness', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ error: 'Unable to load key report completeness.' }));
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Key Report Completeness</h1>
        <p className="text-gray-600">IPE completeness and accuracy checks for SOX key reports.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Report Population" value={data.summary?.reportPopulation} />
        <Metric label="Exceptions" value={data.summary?.exceptions} />
        <Metric label="Completeness Score" value={`${data.summary?.completenessScore}%`} />
        <Metric label="Owner" value={data.summary?.owner} />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {data.reports?.map((report) => (
          <div key={report.name} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-100">
            <strong>{report.name}</strong><span>{report.system}</span><span>{report.exception}</span><span>{report.severity}</span>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold mb-3">Procedures</h2>
        <ul className="list-disc pl-5 space-y-1">{data.procedures?.map((procedure) => <li key={procedure}>{procedure}</li>)}</ul>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
