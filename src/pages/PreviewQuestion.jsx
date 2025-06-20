// src/pages/PreviewQuestionnaire.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Tree from 'react-d3-tree';
import { useNavigate } from 'react-router-dom';

export default function PreviewQuestionnaire() {
  const [nodes, setNodes] = useState(null);
  const [paths, setPaths] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [viewMode, setViewMode] = useState('graph');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function fetch() {
      const qs = await getDocs(query(collection(db, 'questionnaires'), orderBy('order')));
      const data = qs.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuestions(data);
      buildTree(data);
    }
    fetch();
  }, []);

  const buildTree = data => {
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

  const onChangeQ = (idx, field, val) => {
    const qs = [...questions];
    qs[idx][field] = field === 'isRoot' ? !!val : val;
    setQuestions(qs);
    buildTree(qs);
  };

  const onChangeC = (qi, ci, field, val) => {
    const qs = [...questions];
    qs[qi].choices[ci][field] = val;
    setQuestions(qs);
  };

  const addChoice = qi => {
    const qs = [...questions];
    qs[qi].choices.push({ label: '', leadsTo: '', flag: '' });
    setQuestions(qs);
  };

  const removeChoice = (qi, ci) => {
    const qs = [...questions];
    if (qs[qi].choices.length > 1) {
      qs[qi].choices.splice(ci, 1);
      setQuestions(qs);
    } else {
      alert('⚠️ A question must have at least one choice.');
    }
  };

  const removeQuestion = async (qi) => {
    const confirm = window.confirm("Are you sure you want to delete this question?");
    if (!confirm) return;
    const qs = [...questions];
    const idToDelete = qs[qi].id;
    qs.splice(qi, 1);
    await deleteDoc(doc(db, 'questionnaires', idToDelete));
    setQuestions(qs);
    buildTree(qs);
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
      alert('❌ Please fix errors before saving.');
      return;
    }
    for (const q of questions) {
      const { id, ...fields } = q;
      await updateDoc(doc(db, 'questionnaires', id), fields);
    }
    alert('✅ Saved edits successfully!');
    buildTree(questions);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Questionnaire Preview</h2>
        <div>
          <button onClick={() => setViewMode('graph')} className={`px-4 py-2 ${viewMode === 'graph' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Graph</button>
          <button onClick={() => setViewMode('table')} className={`px-4 py-2 ml-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Table</button>
        </div>
      </div>

      {viewMode === 'graph' && (
        <div className="h-96 border bg-white shadow-md overflow-auto">
          {nodes ? (
            <Tree data={nodes} orientation="vertical" translate={{ x: 400, y: 50 }} collapsible={false} />
          ) : <p>Loading map...</p>}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white p-4 shadow rounded">
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Order</th><th className="p-2">Root?</th><th className="p-2">Question</th><th className="p-2">Choices</th><th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, qi) => (
                <tr key={qi}>
                  <td className="p-2 border">{q.order}</td>
                  <td className="p-2 border text-center">
                    <input type="checkbox" checked={q.isRoot} onChange={e => onChangeQ(qi, 'isRoot', e.target.checked)} />
                  </td>
                  <td className={`p-2 border ${errors[`q-${qi}`] ? 'bg-red-100' : ''}`}>
                    <input value={q.text} onChange={e => onChangeQ(qi, 'text', e.target.value)} className="w-full border rounded p-1" />
                  </td>
                  <td className="p-2 border">
                    {q.choices.map((c, ci) => (
                      <div key={ci} className={`flex items-center ${errors[`q-${qi}-c-${ci}`] ? 'bg-red-50 p-1 rounded mb-1' : 'mb-1'}`}>
                        <input placeholder="Label" value={c.label} onChange={e => onChangeC(qi, ci, 'label', e.target.value)} className="border p-1 rounded mr-1" />
                        <input placeholder="LeadsTo" type="number" value={c.leadsTo} onChange={e => onChangeC(qi, ci, 'leadsTo', e.target.value)} className="border p-1 rounded mr-1 w-20" />
                        <input placeholder="Flag" value={c.flag} onChange={e => onChangeC(qi, ci, 'flag', e.target.value)} className="border p-1 rounded mr-1" />
                        <button onClick={() => removeChoice(qi, ci)} className="text-red-500">❌</button>
                      </div>
                    ))}
                    <button onClick={() => addChoice(qi)} className="text-blue-600 text-sm">+ Add Choice</button>
                  </td>
                  <td className="p-2 border text-center">
                    <button onClick={() => removeQuestion(qi)} className="text-red-600 text-sm">🗑 Delete Q</button>
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
  );
}
