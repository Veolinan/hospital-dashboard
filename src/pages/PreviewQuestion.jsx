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
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
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
          attributes: { flag: c.flag || '', weight: c.weight, classification: c.classification }
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
        const { id, editing, ...fields } = q;
        await updateDoc(doc(db, 'questionnaires', id), fields);
      }
      toast.success('✅ Saved successfully!');
      buildTree(questions);
    } catch (err) {
      toast.error('❌ Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const addChoice = (qi) => {
    const qs = [...questions];
    qs[qi].choices.push({ label: '', leadsTo: '', flag: '', weight: 0, classification: '' });
    setQuestions(qs);
  };

  const removeChoice = (qi, ci) => {
    const qs = [...questions];
    if (qs[qi].choices.length > 1) {
      qs[qi].choices.splice(ci, 1);
      setQuestions(qs);
    } else {
      toast.warn('⚠️ At least one choice is required.');
    }
  };

  const deleteQuestion = async (qi) => {
    const confirm = window.confirm('Delete this entire question?');
    if (!confirm) return;
    const id = questions[qi].id;
    const qs = [...questions];
    qs.splice(qi, 1);
    await deleteDoc(doc(db, 'questionnaires', id));
    setQuestions(qs);
    buildTree(qs);
  };

  return (
    <div className="relative">
      {saving && (
        <>
          <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-50" />
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-blue-700 text-lg font-semibold animate-pulse">Saving your edits...</p>
          </div>
        </>
      )}

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Questionnaire Preview</h2>
          <div className="space-x-2">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-4 py-2 rounded ${viewMode === 'graph' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Graph
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Table
            </button>
          </div>
        </div>

        {viewMode === 'graph' && (
          <div className="h-[28rem] border bg-white shadow-md overflow-auto">
            {nodes ? (
              <Tree data={nodes} orientation="vertical" translate={{ x: 400, y: 50 }} collapsible={false} />
            ) : (
              <p>Loading map...</p>
            )}
            {paths.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Decision Paths</h3>
                {paths.map((p, i) => (
                  <div key={i} className="mb-2 p-3 bg-gray-100 rounded">
                    <p>
                      <strong>Path {i + 1}:</strong> {p.join(' → ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="bg-white p-4 shadow rounded space-y-4">
            {questions.map((q, qi) => {
              const isEditing = q.editing;
              const questionError = errors[`q-${qi}`];
              return (
                <div
                  key={qi}
                  className={`border rounded-lg p-4 shadow-sm bg-gray-50 ${
                    questionError ? 'border-red-500 bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-600">
                        Order: <span className="font-medium">{q.order}</span>
                      </p>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={q.isRoot}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qi].isRoot = e.target.checked;
                            setQuestions(updated);
                          }}
                          disabled={!isEditing}
                        />
                        Root?
                      </label>
                    </div>
                    <div className="space-x-2">
                      {!isEditing ? (
                        <button
                          onClick={() => {
                            const updated = questions.map((item, idx) =>
                              idx === qi ? { ...item, editing: true } : item
                            );
                            setQuestions(updated);
                          }}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          ✏️ Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              const updated = [...questions];
                              updated[qi].editing = false;
                              setQuestions(updated);
                            }}
                            className="text-gray-600 text-sm hover:underline"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const updated = [...questions];
                              updated[qi].editing = false;
                              setQuestions(updated);
                            }}
                            className="text-green-600 text-sm hover:underline"
                          >
                            Save
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteQuestion(qi)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    {isEditing ? (
                      <textarea
                        className={`w-full border rounded-md p-2 text-sm resize-y ${
                          questionError ? 'border-red-500 bg-red-50' : ''
                        }`}
                        rows={2}
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qi].text = e.target.value;
                          setQuestions(updated);
                        }}
                      />
                    ) : (
                      <p className="text-base font-medium">{q.text}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Choices:</h4>
                    {q.choices.map((c, ci) => {
                      const choiceError = errors[`q-${qi}-c-${ci}`];
                      return (
                        <div
                          key={ci}
                          className={`flex flex-wrap gap-2 items-center mb-2 ${
                            choiceError ? 'border border-red-500 bg-red-50 rounded px-2 py-1' : ''
                          }`}
                        >
                          {isEditing ? (
                            <>
                              <input
                                value={c.label}
                                onChange={(e) => {
                                  const qs = [...questions];
                                  qs[qi].choices[ci].label = e.target.value;
                                  setQuestions(qs);
                                }}
                                className="border p-1 rounded text-sm w-28"
                                placeholder="Label"
                              />
                              <input
                                type="number"
                                value={c.leadsTo}
                                onChange={(e) => {
                                  const qs = [...questions];
                                  qs[qi].choices[ci].leadsTo = parseInt(e.target.value) || '';
                                  setQuestions(qs);
                                }}
                                className="border p-1 rounded text-sm w-20"
                                placeholder="LeadsTo"
                              />
                              <input
                                value={c.flag}
                                onChange={(e) => {
                                  const qs = [...questions];
                                  qs[qi].choices[ci].flag = e.target.value;
                                  setQuestions(qs);
                                }}
                                className="border p-1 rounded text-sm w-20"
                                placeholder="Flag"
                              />
                              <input
                                type="number"
                                value={c.weight}
                                onChange={(e) => {
                                  const qs = [...questions];
                                  qs[qi].choices[ci].weight = parseFloat(e.target.value) || 0;
                                  setQuestions(qs);
                                }}
                                className="border p-1 rounded text-sm w-16"
                                placeholder="Weight"
                              />
                              <select
                                value={c.classification || ''}
                                onChange={(e) => {
                                  const qs = [...questions];
                                  qs[qi].choices[ci].classification = e.target.value;
                                  setQuestions(qs);
                                }}
                                className="border p-1 rounded text-sm w-32"
                              >
                                <option value="">Classification</option>
                                <option value="danger">Danger Zone</option>
                                <option value="alert">Alert Zone</option>
                                <option value="low">Low Risk</option>
                              </select>
                              <button
                                onClick={() => removeChoice(qi, ci)}
                                className="text-red-500 text-sm hover:underline"
                              >
                                ❌
                              </button>
                            </>
                          ) : (
                            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {c.label} → {c.leadsTo || 'End'} {c.flag ? `(Flag: ${c.flag})` : ''} {`[W: ${c.weight ?? 0}]`} {c.classification ? `(${c.classification})` : ''}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {isEditing && (
                      <button
                        onClick={() => addChoice(qi)}
                        className="text-sm text-blue-600 hover:underline mt-1"
                      >
                        + Add Choice
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="mt-6 flex justify-between">
              <button
                onClick={onSaveTable}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                💾 Save All Changes
              </button>
              <button
                onClick={() => navigate('/question-builder')}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                ← Back to Builder
              </button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
