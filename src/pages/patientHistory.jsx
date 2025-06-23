// src/pages/PatientHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PatientHistory() {
  const { patientId } = useParams();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "questionnaire_responses"),
      where("patientId", "==", patientId),
      orderBy("submittedAt", "desc")
    );
    return onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [patientId]);

  const chartData = useMemo(() => {
    const counts = {};
    reports.forEach(r => {
      const date = r.submittedAt?.toDate().toLocaleDateString() || "";
      counts[date] = (counts[date] || 0) + 1;
    });
    const labels = Object.keys(counts).reverse();
    const dataPoints = labels.map(l => counts[l]);
    return {
      labels,
      datasets: [{
        label: "Cases Submitted",
        data: dataPoints,
        backgroundColor: "#3b82f6"
      }]
    };
  }, [reports]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <Link to="/patient-reports" className="text-blue-600 hover:underline">← Back to Reports</Link>

      <h2 className="text-2xl font-bold mb-4">Patient History: {reports[0]?.patientName || patientId}</h2>

      {reports.length === 0 ? (
        <p className="text-center text-gray-500">No history found for this patient.</p>
      ) : (
        <>
          <section className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Case History & Notes</h3>
            <ul className="space-y-4 divide-y">
              {reports.map((r, i) => (
                <li key={r.id} className="pt-4">
                  <p className="text-sm text-gray-500">
                    Submitted on {r.submittedAt?.toDate().toLocaleString()}
                  </p>
                  <p><strong>Stage:</strong> {r.stage?.type} – {r.stage?.range}</p>
                  <p><strong>Condition:</strong> {r.suggestedCondition || "None"}</p>
                  {r.flags?.length > 0 && (
                    <p><strong>Flagged Symptoms:</strong> {r.flags.join(", ")}</p>
                  )}
                  {r.doctorNotes && (
                    <div className="mt-2 bg-gray-50 p-3 rounded">
                      <p><strong>Doctor's Notes:</strong></p>
                      <p className="whitespace-pre-wrap">{r.doctorNotes}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Submission Analytics</h3>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </section>
        </>
      )}
    </div>
  );
}
