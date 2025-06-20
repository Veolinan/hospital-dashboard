// src/pages/PreviewQuestionnaire.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Tree from 'react-d3-tree';
import { useNavigate } from 'react-router-dom';

export default function PreviewQuestionnaire() {
  const [nodes, setNodes] = useState(null);
  const [paths, setPaths] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'table'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      const qsnap = await getDocs(query(collection(db, 'questionnaires'), orderBy('order')));
      const qdata = qsnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuestions(qdata);
      buildTree(qdata);
    };

    const buildTree = (data) => {
      const rootQs = data.filter(q => q.isRoot);
      if (!rootQs.length) return;
      const root = rootQs[0];
      const mapByOrder = Object.fromEntries(data.map(q => [q.order, q]));

      const buildNode = q => ({
        name: q.text,
        children: q.choices.map(c => {
          const next = c.leadsTo ? mapByOrder[c.leadsTo] : null;
          return {
            name: c.label,
            children: next ? [buildNode(next)] : [],
            attributes: { flag: c.flag || '' }
          };
        })
      });

      const tree = {
        name: root.text,
        children: root.choices.map(c => {
          const next = mapByOrder[c.leadsTo];
          return {
            name: c.label,
            children: next ? [buildNode(next)] : [],
            attributes: { flag: c.flag || '' }
          };
        })
      };

      setNodes(tree);

      // Gather decision paths
      const collected = [];
      const traverse = (node, trail) => {
        const newTrail = [...trail, node.name];
        if (!node.children || node.children.length === 0) {
          collected.push(newTrail);
        } else {
          node.children.forEach(child => traverse(child, newTrail));
        }
      };
      traverse(tree, []);
      setPaths(collected);
    };

    fetchAll();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Questionnaire Preview</h2>
        <div className="space-x-2">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-4 py-2 rounded ${viewMode === 'graph' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            🧠 Graphical View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            📄 Table View
          </button>
        </div>
      </div>

      {viewMode === 'graph' && (
        <>
          {nodes ? (
            <div id="mind-map" className="h-[500px] border bg-white shadow-md overflow-auto">
              <Tree
                data={nodes}
                orientation="vertical"
                translate={{ x: 400, y: 50 }}
                pathFunc="elbow"
                collapsible={false}
              />
            </div>
          ) : (
            <p>Loading mind map...</p>
          )}

          {paths.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mt-6 mb-4">Decision Paths & Conclusions</h3>
              {paths.map((p, i) => (
                <div key={i} className="mb-3 p-3 bg-gray-100 rounded">
                  <p className="font-medium">Path {i + 1}:</p>
                  <ol className="list-decimal list-inside">
                    {p.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {viewMode === 'table' && (
        <div className="overflow-auto shadow border rounded bg-white p-4">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Order</th>
                <th className="p-2 border">Root</th>
                <th className="p-2 border text-left">Question</th>
                <th className="p-2 border text-left">Choices</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-2 border text-center">{q.order}</td>
                  <td className="p-2 border text-center">{q.isRoot ? '✅' : ''}</td>
                  <td className="p-2 border">{q.text}</td>
                  <td className="p-2 border">
                    <ul className="list-disc pl-4 space-y-1">
                      {q.choices.map((c, i) => (
                        <li key={i}>
                          {c.label} → <strong>{c.leadsTo || 'End'}</strong> {c.flag && `(Flag: ${c.flag})`}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 text-right">
            <button
              onClick={() => navigate('/question-builder')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ✏️ Edit Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
