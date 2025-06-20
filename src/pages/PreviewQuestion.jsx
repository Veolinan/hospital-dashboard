// src/pages/PreviewQuestionnaire.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Tree from 'react-d3-tree';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PreviewQuestionnaire() {
  const [nodes, setNodes] = useState(null);
  const [paths, setPaths] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [viewMode, setViewMode] = useState('graph');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const qs = await getDocs(query(collection(db, 'questionnaires'), orderBy('order')));
      const data = qs.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuestions(data);
      buildTree(data);
    };
    fetch();
  }, []);

  const buildTree = (data) => {
    const roots = data.filter(q => q.isRoot);
    const mapByOrder = Object.fromEntries(data.map(q => [q.order, q]));

    const makeNode = q => ({
      name: q.text,
      children: q.choices.map(c => {
        const next = mapByOrder[c.leadsTo];
        return {
          name: c.label,
          children: next ? [makeNode(next)] : [],
          attributes: { flag: c.flag || '' }
        };
      }),
    });

    const tree = { name: 'Start', children: roots.map(makeNode) };
    setNodes(tree);

    const collected = [];
    const dive = (node, trail) => {
      const t2 = [...trail, node.name];
      if (!node.children?.length) collected.push(t2);
      else node.children.forEach(c => dive(c, t2));
    };
    dive(tree, []);
    setPaths(collected);
  };

  const validateAll = () => {
    const errs = {};
    questions.forEach((q, qi) => {
      if (!q.text.trim()) errs[`q-${qi}`] = true;
      q.choices.forEach((c, ci) => {
        if (!c.label.trim()) errs[`q-${qi}-c-${ci}`] = true;
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSaveTable = async () => {
    if (!validateAll()) {
      toast.error('❌ Please fix errors before saving.');
      return;
    }

    setSaving(true);
    try {
      for (const q of questions) {
        const { id, ...fields } = q;
        await updateDoc(doc(db, 'questionnaires', id), fields);
      }

      toast.success('✅ Saved successfully!', {
        icon: '✔️',
        position: 'top-center',
        autoClose: 2500,
        className: 'text-green-700 font-medium',
      });

      buildTree(questions);
    } catch (err) {
      toast.error('❌ Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Blurred Overlay + Spinner */}
      {saving && (
        <>
          <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-50" />
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-blue-700 text-lg font-semibold animate-pulse">Saving your edits...</p>
          </div>
        </>
      )}

      {/* Header */}
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Questionnaire Preview</h2>
          <div>
            <button onClick={() => setViewMode('graph')} className={`px-4 py-2 ${viewMode === 'graph' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded`}>Graph</button>
            <button onClick={() => setViewMode('table')} className={`px-4 py-2 ml-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded`}>Table</button>
          </div>
        </div>

        {/* Graph View */}
        {viewMode === 'graph' && (
          <div className="h-96 border bg-white shadow-md overflow-auto">
            {nodes ? (
              <Tree data={nodes} orientation="vertical" translate={{ x: 400, y: 50 }} collapsible={false} />
            ) : <p>Loading map...</p>}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white p-4 shadow rounded">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Order</th>
                  <th className="p-2">Root?</th>
                  <th className="p-2">Question</th>
                  <th className="p-2">Choices</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, qi) => (
                  <tr key={qi}>
                    <td className="p-2 border">{q.order}</td>
                    <td className="p-2 border text-center">
                      <input type="checkbox" checked={q.isRoot} onChange={e => {
                        const qs = [...questions];
                        qs[qi].isRoot = e.target.checked;
                        setQuestions(qs);
                      }} />
                    </td>
                    <td className={`p-2 border ${errors[`q-${qi}`] ? 'bg-red-100' : ''}`}>
                      <input
                        value={q.text}
                        onChange={e => {
                          const qs = [...questions];
                          qs[qi].text = e.target.value;
                          setQuestions(qs);
                        }}
                        className="w-full border rounded p-1"
                      />
                    </td>
                    <td className="p-2 border">
                      {q.choices.map((c, ci) => (
                        <div key={ci} className="flex items-center space-x-2 mb-2">
                          <input
                            value={c.label}
                            placeholder="Label"
                            onChange={e => {
                              const qs = [...questions];
                              qs[qi].choices[ci].label = e.target.value;
                              setQuestions(qs);
                            }}
                            className="border p-1 rounded"
                          />
                          <input
                            type="number"
                            value={c.leadsTo}
                            placeholder="LeadsTo"
                            onChange={e => {
                              const qs = [...questions];
                              qs[qi].choices[ci].leadsTo = parseInt(e.target.value);
                              setQuestions(qs);
                            }}
                            className="border p-1 rounded w-20"
                          />
                          <input
                            value={c.flag}
                            placeholder="Flag"
                            onChange={e => {
                              const qs = [...questions];
                              qs[qi].choices[ci].flag = e.target.value;
                              setQuestions(qs);
                            }}
                            className="border p-1 rounded"
                          />
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-between">
              <button onClick={onSaveTable} className="px-4 py-2 bg-green-600 text-white rounded">💾 Save Edits</button>
              <button onClick={() => navigate('/question-builder')} className="px-4 py-2 bg-gray-200 rounded">← Back to Builder</button>
            </div>
          </div>
        )}

        {/* Graph Path View */}
        {paths.length > 0 && viewMode === 'graph' && (
          <section>
            <h3 className="text-xl font-semibold">Decision Paths</h3>
            {paths.map((p, i) => (
              <div key={i} className="mb-2 p-3 bg-gray-100 rounded">
                <p><strong>Path {i + 1}:</strong> {p.join(' → ')}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
