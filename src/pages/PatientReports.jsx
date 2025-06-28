import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["submitted", "under review", "booked", "reviewed", "resolved"];

export default function PatientReports() {
  const [reports, setReports] = useState([]);
  const [filterDoc, setFilterDoc] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStageType, setFilterStageType] = useState("");
  const [filterStageRange, setFilterStageRange] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const stageRanges = {
    pregnant: ["1–3 months", "4–6 months", "7–9 months"],
    postpartum: ["1–4 weeks", "4–8 weeks", "8–20 weeks", "6–9 months", "10–12 months"],
  };

  useEffect(() => {
    const q = query(
      collection(db, "questionnaire_responses"),
      orderBy("submittedAt", "desc")
    );
    return onSnapshot(q, snap =>
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const filteredReports = useMemo(() => {
    return reports
      .filter(r => {
        if (filterDoc && r.reviewedBy?.name !== filterDoc) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        if (filterStageType && r.stage?.type !== filterStageType) return false;
        if (filterStageRange && r.stage?.range !== filterStageRange) return false;
        return true;
      })
      .sort((a, b) => (b.totalWeight || 0) - (a.totalWeight || 0));
  }, [reports, filterDoc, filterStatus, filterStageType, filterStageRange]);

  const paginated = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.ceil(filteredReports.length / PAGE_SIZE);

  const exportCSV = () => {
    if (!filteredReports.length) return alert("No reports to export!");
    const header = [
      "Patient", "Date", "CSR", "Risk Classification", "Doctor", "Status",
      "Stage Type", "Stage Range", "Symptoms", "Condition"
    ];
    const rows = filteredReports.map(r => [
      r.patientName,
      r.submittedAt?.toDate().toLocaleString() || "N/A",
      r.totalWeight,
      r.riskClassification,
      r.reviewedBy?.name || "-",
      r.status,
      r.stage?.type,
      r.stage?.range,
      r.flags?.join(", "),
      r.flags?.slice(-1)[0] || "-"
    ]);
    const csv = "data:text/csv;charset=utf-8," +
      [header, ...rows].map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "patient_reports.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!filteredReports.length) return alert("No reports to export!");
    const doc = new jsPDF();
    doc.text("Patient Reports", 14, 16);
    doc.autoTable({
      startY: 20,
      head: [[
        "Patient", "Date", "CSR", "Risk", "Doctor", "Status",
        "Stage", "Symptoms", "Condition"
      ]],
      body: filteredReports.map(r => [
        r.patientName,
        r.submittedAt?.toDate().toLocaleDateString(),
        r.totalWeight,
        r.riskClassification,
        r.reviewedBy?.name || "-",
        r.status,
        `${r.stage?.type} — ${r.stage?.range}`,
        r.flags?.join(", "),
        r.flags?.slice(-1)[0] || "-"
      ]),
    });
    doc.save("patient_reports.pdf");
  };

  const handleUpdate = async (id, field, val) => {
    const ref = doc(db, "questionnaire_responses", id);
    const changes = { [field]: val, updatedAt: serverTimestamp() };
    if (field === "status") {
      changes.reviewedBy = {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || auth.currentUser.email,
      };
    }
    await updateDoc(ref, changes);
  };

  const rowColor = (risk) => {
    switch (risk) {
      case "Danger Zone":
        return "bg-red-600";
      case "Alert Zone":
        return "bg-yellow-300";
      default:
        return "bg-green-500";
    }
  };

  return (
    <div className="p-6 w-full max-w-none mx-auto space-y-6 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold">📋 Patient Reports</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          placeholder="Filter by Doctor"
          value={filterDoc}
          onChange={e => { setFilterDoc(e.target.value); setPage(1); }}
          className="border p-2 rounded"
        />
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="border p-2 rounded"
        >
          <option value="">-- Status --</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterStageType}
          onChange={e => {
            setFilterStageType(e.target.value);
            setFilterStageRange("");
            setPage(1);
          }}
          className="border p-2 rounded"
        >
          <option value="">-- Stage Type --</option>
          <option value="pregnant">Pregnant</option>
          <option value="postpartum">Postpartum</option>
        </select>
        {filterStageType && (
          <select
            value={filterStageRange}
            onChange={e => { setFilterStageRange(e.target.value); setPage(1); }}
            className="border p-2 rounded"
          >
            <option value="">-- Stage Range --</option>
            {stageRanges[filterStageType].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        <button
          onClick={() => {
            setFilterDoc("");
            setFilterStatus("");
            setFilterStageType("");
            setFilterStageRange("");
            setPage(1);
          }}
          className="bg-gray-300 px-3 py-1 rounded"
        >
          Clear Filters
        </button>
        <button
          onClick={exportCSV}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Export CSV
        </button>
        <button
          onClick={exportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Export PDF
        </button>
      </div>

      {/* Reports Table */}
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {[
              "Patient", "Date", "CSR", "Risk", "Status", "Stage",
              "Symptoms", "Condition", "Doctor", "Notes", "Actions"
            ].map(h => (
              <th key={h} className="border p-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan="11" className="p-4 text-center">
                No reports found.
              </td>
            </tr>
          ) : paginated.map(r => (
            <tr key={r.id} className={`${rowColor(r.riskClassification)} border-b border-gray-200`}>
              <td className="p-2 border">{r.patientName}</td>
              <td className="p-2 border">{r.submittedAt?.toDate().toLocaleString() || "-"}</td>
              <td className="p-2 border font-medium">{r.totalWeight}</td>
              <td className="p-2 border">{r.riskClassification}</td>
              <td className="p-2 border">
                <select
                  value={r.status}
                  onChange={e => handleUpdate(r.id, "status", e.target.value)}
                  className="border rounded p-1"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="p-2 border">{`${r.stage?.type} — ${r.stage?.range}`}</td>
              <td className="p-2 border">{r.flags?.join(", ") || "-"}</td>
              <td className="p-2 border">{r.flags?.slice(-1)[0] || "-"}</td>
              <td className="p-2 border">{r.reviewedBy?.name || "-"}</td>
              <td className="p-2 border bg-gray-50 w-64">
                <textarea
                  value={r.doctorNotes || ""}
                  onChange={e => handleUpdate(r.id, "doctorNotes", e.target.value)}
                  className="border rounded p-1 w-full resize-none bg-white"
                  placeholder="Add notes..."
                />
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => navigate(`/patient-history/${r.patientId}`, { state: { patientId: r.patientId } })}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  View Profile
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {page} of {pageCount}</span>
          <button
            disabled={page === pageCount}
            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
