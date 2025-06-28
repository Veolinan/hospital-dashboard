// src/pages/QuestionBuilder.jsx
import React, { useState, useEffect } from 'react';
import {
  addDoc,
  updateDoc,
  doc,
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';

export default function QuestionBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  const STAGES = ['pregnant', 'postpartum'];
  const RANGES = {
    pregnant: ['1–3 months', '4–6 months', '7–9 months'],
    postpartum: ['1–4 weeks', '4–8 weeks', '8–20 weeks', '6–9 months', '10–12 months'],
  };

  const [stageType, setStageType] = useState('pregnant');
  const [stageRange, setStageRange] = useState(RANGES.pregnant[0]);
  const [category, setCategory] = useState('');
  const [evaluatedCondition, setEvaluatedCondition] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      order: 1,
      isRoot: true,
      text: '',
      choices: [{ label: '', leadsTo: '', flag: '', weight: 0, riskLevel: '' }],
    },
  ]);
  const [showPaste, setShowPaste] = useState(false);
  const [pastedJSON, setPastedJSON] = useState('');
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (location.state?.questionnaire) {
      const q = location.state.questionnaire;
      setEditingId(q.id);
      setCategory(q.category);
      setEvaluatedCondition(q.evaluatedCondition);
      setStageType(q.stageType);
      setStageRange(q.stageRange);
      setQuestions(q.questions.map((qq, idx) => ({ ...qq, order: idx + 1 })));
    }
  }, [location.state]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const snap = await getDocs(query(collection(db, 'questionnaires'), orderBy('timestamp', 'desc')));
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadFromJSON = obj => {
    if (!obj) return;
    if (Array.isArray(obj.questions)) setQuestions(obj.questions);
    if (obj.category) setCategory(obj.category);
    if (obj.evaluatedCondition) setEvaluatedCondition(obj.evaluatedCondition);
    if (obj.stageType) {
      setStageType(obj.stageType);
      if (obj.stageRange) setStageRange(obj.stageRange);
    }
  };

  const addQuestion = () => {
    const nextId = 'q' + (questions.length + 1);
    setQuestions(prev => [
      ...prev,
      {
        id: nextId,
        order: prev.length + 1,
        isRoot: false,
        text: '',
        choices: [{ label: '', leadsTo: '', flag: '', weight: 0, riskLevel: '' }],
      },
    ]);
  };

  const updateQuestion = (qi, field, val) => {
    const newQuestions = [...questions];
    newQuestions[qi][field] = field === 'isRoot' ? !!val : val;
    setQuestions(newQuestions);
  };

  const updateChoice = (qi, ci, field, val) => {
    const newQuestions = [...questions];
    newQuestions[qi].choices[ci][field] = val;
    setQuestions(newQuestions);
  };

  const addChoice = qi => {
    const newQuestions = [...questions];
    newQuestions[qi].choices.push({
      label: '',
      leadsTo: '',
      flag: '',
      weight: 0,
      riskLevel: '',
    });
    setQuestions(newQuestions);
  };

  const handleJSONUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        loadFromJSON(JSON.parse(evt.target.result));
        alert('✅ JSON loaded');
      } catch {
        alert('❌ Invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteJSON = () => {
    try {
      loadFromJSON(JSON.parse(pastedJSON));
      alert('✅ JSON loaded');
    } catch {
      alert('❌ Invalid JSON');
    }
  };

  const handleSubmit = async () => {
    if (!category || !evaluatedCondition) return alert('Category and Condition required.');
    const payload = {
      stageType,
      stageRange,
      category,
      evaluatedCondition,
      questions,
      timestamp: Date.now(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'questionnaires', editingId), payload);
      } else {
        await addDoc(collection(db, 'questionnaires'), payload);
      }
      alert('✅ Saved');
      navigate('/preview-question', { state: { questionnaire: payload } });
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDeleteSaved = async id => {
    const confirm = window.confirm('🗑 Are you sure you want to delete this questionnaire?');
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, 'questionnaires', id));
      setHistory(prev => prev.filter(q => q.id !== id));
      alert('✅ Deleted');
    } catch (err) {
      alert('❌ Failed to delete: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="mb-4 text-2xl font-bold">📋 Questionnaire Builder</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          placeholder="Category"
          className="border p-2 rounded"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <input
          placeholder="Condition"
          className="border p-2 rounded"
          value={evaluatedCondition}
          onChange={e => setEvaluatedCondition(e.target.value)}
        />
        <select
          value={stageType}
          onChange={e => {
            setStageType(e.target.value);
            setStageRange(RANGES[e.target.value][0]);
          }}
          className="border p-2 rounded"
        >
          {STAGES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={stageRange}
          onChange={e => setStageRange(e.target.value)}
          className="border p-2 rounded"
        >
          {RANGES[stageType].map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 mb-6">
        <label className="p-2 bg-blue-100 rounded cursor-pointer">
          📁 Upload JSON
          <input type="file" accept=".json" className="hidden" onChange={handleJSONUpload} />
        </label>
        <button className="p-2 bg-yellow-100 rounded" onClick={() => setShowPaste(prev => !prev)}>
          📝 {showPaste ? 'Hide Paste' : 'Paste JSON'}
        </button>
      </div>

      {showPaste && (
        <div className="mb-6">
          <textarea
            className="w-full border p-2 rounded font-mono"
            rows={5}
            value={pastedJSON}
            onChange={e => setPastedJSON(e.target.value)}
            placeholder="Paste JSON here…"
          />
          <button
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
            onClick={handlePasteJSON}
          >
            Load from Paste
          </button>
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={q.id} className="mb-4 p-4 border rounded bg-gray-50">
          <div className="flex items-center gap-4 mb-2">
            <span className="font-bold">[{q.id}] Q{q.order}:</span>
            <input
              className="flex-1 border p-1 rounded"
              placeholder="Question text"
              value={q.text}
              onChange={e => updateQuestion(qi, 'text', e.target.value)}
            />
            <label className="flex items-center gap-1">
              Root?{' '}
              <input
                type="checkbox"
                checked={q.isRoot}
                onChange={e => updateQuestion(qi, 'isRoot', e.target.checked)}
              />
            </label>
          </div>
          {q.choices.map((c, ci) => (
            <div key={ci} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
              <input
                className="border p-1 rounded"
                placeholder="Label"
                value={c.label}
                onChange={e => updateChoice(qi, ci, 'label', e.target.value)}
              />
              <input
                className="border p-1 rounded"
                placeholder="LeadsTo"
                value={c.leadsTo}
                onChange={e => updateChoice(qi, ci, 'leadsTo', e.target.value)}
              />
              <input
                className="border p-1 rounded"
                placeholder="Flag"
                value={c.flag}
                onChange={e => updateChoice(qi, ci, 'flag', e.target.value)}
              />
              <input
                className="border p-1 rounded"
                type="number"
                placeholder="Weight"
                value={c.weight ?? ''}
                onChange={e =>
                  updateChoice(qi, ci, 'weight', parseInt(e.target.value) || 0)
                }
              />
              <select
                className="border p-1 rounded"
                value={c.riskLevel || ''}
                onChange={e => updateChoice(qi, ci, 'riskLevel', e.target.value)}
              >
                <option value="">Risk</option>
                <option value="low">Low</option>
                <option value="alert">Alert</option>
                <option value="danger">Danger</option>
              </select>
            </div>
          ))}
          <button className="text-blue-600" onClick={() => addChoice(qi)}>
            + Add Choice
          </button>
        </div>
      ))}

      <div className="flex justify-between mt-6 mb-8">
        <button className="bg-gray-200 px-4 py-2 rounded" onClick={addQuestion}>
          ➕ Add Question
        </button>
        <button className="bg-green-600 px-6 py-2 text-white rounded" onClick={handleSubmit}>
          ✅ Save Questionnaire
        </button>
      </div>

      {!!history.length && (
        <div className="mt-10">
          <h3 className="mb-2 font-semibold text-lg">📂 Saved Questionnaires</h3>
          <ul className="space-y-2">
            {history.map(q => {
              const date = new Date(q.timestamp).toLocaleString();
              const name = `${q.stageRange} — ${q.stageType} — ${date}`;
              return (
                <li
                  key={q.id}
                  className="flex justify-between items-center bg-gray-100 p-2 rounded"
                >
                  <span className="font-medium">{name}</span>
                  <div className="space-x-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => navigate('/preview-question', { state: { questionnaire: q } })}
                    >
                      👁️ Preview
                    </button>
                    <button
                      className="text-green-600 hover:underline"
                      onClick={() => navigate('/question-builder', { state: { questionnaire: q } })}
                    >
                      🛠 Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDeleteSaved(q.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
