// src/pages/QuestionBuilder.jsx
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function QuestionBuilder() {
  const navigate = useNavigate();
  const STAGES = ['pregnant', 'postpartum'];
  const RANGES = {
    pregnant: ['1–3 months', '4–6 months', '7–9 months'],
    postpartum: ['1–4 weeks', '4–8 weeks', '8–20 weeks', '6–9 months', '10–12 months'],
  };

  const [mode, setMode] = useState('init');
  const [stageType, setStageType] = useState('pregnant');
  const [stageRange, setStageRange] = useState(RANGES.pregnant[0]);
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { order: prev.length + 1, isRoot: false, text: '', choices: [{ label: '', leadsTo: '', flag: '' }] }
    ]);
  };

  const addChoice = (qi) => {
    const updated = [...questions];
    updated[qi].choices.push({ label: '', leadsTo: '', flag: '' });
    setQuestions(updated);
  };

  const updateQuestion = (qi, field, val) => {
    const updated = [...questions];
    updated[qi][field] = val;
    setQuestions(updated);
  };

  const updateChoice = (qi, ci, field, val) => {
    const updated = [...questions];
    updated[qi].choices[ci][field] = val;
    setQuestions(updated);
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const reordered = Array.from(questions);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setQuestions(reordered.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const validate = qs => {
    const err = {};
    qs.forEach((q, qi) => {
      if (!q.text.trim()) err[`q-${qi}`] = true;
      q.choices.forEach((c, ci) => {
        if (!c.label.trim()) err[`q-${qi}-c-${ci}`] = true;
      });
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!category.trim()) return alert('⚠️ Category is required');
    if (!validate(questions)) return alert('⚠️ Fix validation errors before saving');

    for (const q of questions) {
      await addDoc(collection(db, 'questionnaires'), {
        stageType,
        stageRange,
        category,
        ...q,
        timestamp: Date.now()
      });
    }

    alert('✅ Questionnaire saved successfully');
    navigate('/preview-question');
  };

  const downloadTemplate = () => {
    const now = new Date();
    const filename = `Questionnaire draft ${now.toISOString().slice(0, 10)} ${now
      .toTimeString().slice(0, 8).replace(/:/g, '-')}.xlsx`;

    const qSheet = XLSX.utils.json_to_sheet([
      { order: 1, isRoot: true, text: 'Example question' }
    ]);
    const cSheet = XLSX.utils.json_to_sheet([
      { questionOrder: 1, label: 'Yes', leadsTo: 2, flag: '' },
      { questionOrder: 1, label: 'No', leadsTo: '', flag: 'danger' }
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, qSheet, 'questions');
    XLSX.utils.book_append_sheet(wb, cSheet, 'choices');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), filename);
    setMode('import');
    alert('✅ Template downloaded');
  };

  const importFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const qs = XLSX.utils.sheet_to_json(wb.Sheets['questions']);
      const cs = XLSX.utils.sheet_to_json(wb.Sheets['choices']);

      const parsed = qs.map(q => ({
        order: q.order,
        isRoot: q.isRoot === true || q.isRoot === 'TRUE' || q.isRoot === 'true',
        text: q.text,
        choices: cs
          .filter(c => c.questionOrder === q.order)
          .map(c => ({ label: c.label, leadsTo: c.leadsTo || '', flag: c.flag || '' }))
      }));

      setQuestions(parsed);
      setMode('draft');
      validate(parsed);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-700">📋 Questionnaire Builder</h2>
        <button onClick={() => navigate('/preview-question')} className="px-4 py-2 bg-indigo-600 text-white rounded">
          👁️ Preview
        </button>
      </header>

      {mode === 'init' && (
        <div className="space-x-4 mb-6">
          <button onClick={() => setMode('draft')} className="bg-gray-200 px-4 py-2 rounded">➕ Create New</button>
          <button onClick={downloadTemplate} className="bg-gray-200 px-4 py-2 rounded">⬇️ Download Template</button>
        </div>
      )}

      {mode === 'import' && (
        <label className="bg-blue-100 px-4 py-2 mb-6 inline-block rounded cursor-pointer">
          ⬆️ Upload XLSX File
          <input type="file" accept=".xlsx" onChange={importFile} className="hidden" />
        </label>
      )}

      {mode === 'draft' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Category (e.g. headache)"
              className="border p-2 rounded"
            />
            <select value={stageType} onChange={e => {
              setStageType(e.target.value);
              setStageRange(RANGES[e.target.value][0]);
            }} className="border p-2 rounded">
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={stageRange} onChange={e => setStageRange(e.target.value)} className="border p-2 rounded">
              {RANGES[stageType].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {provided => (
                <table ref={provided.innerRef} {...provided.droppableProps} className="w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th>#</th><th>Root?</th><th>Question</th><th>Choices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, qi) => (
                      <Draggable key={qi} draggableId={`q-${qi}`} index={qi}>
                        {prov => (
                          <tr ref={prov.innerRef} {...prov.draggableProps} className={errors[`q-${qi}`] ? 'bg-red-100' : ''}>
                            <td {...prov.dragHandleProps}>{q.order}</td>
                            <td><input type="checkbox" checked={q.isRoot} onChange={e => updateQuestion(qi, 'isRoot', e.target.checked)} /></td>
                            <td><input
                              value={q.text}
                              onChange={e => updateQuestion(qi, 'text', e.target.value)}
                              className="w-full border p-1 rounded"
                            /></td>
                            <td>
                              {q.choices.map((c, ci) => (
                                <div key={ci} className={`flex gap-2 mb-1 ${errors[`q-${qi}-c-${ci}`] ? 'bg-red-50 p-1 rounded' : ''}`}>
                                  <input
                                    placeholder="Label"
                                    value={c.label}
                                    onChange={e => updateChoice(qi, ci, 'label', e.target.value)}
                                    className="border p-1 rounded w-1/3"
                                  />
                                  <input
                                    placeholder="LeadsTo"
                                    value={c.leadsTo}
                                    onChange={e => updateChoice(qi, ci, 'leadsTo', e.target.value)}
                                    className="border p-1 rounded w-1/3"
                                  />
                                  <input
                                    placeholder="Flag"
                                    value={c.flag}
                                    onChange={e => updateChoice(qi, ci, 'flag', e.target.value)}
                                    className="border p-1 rounded w-1/3"
                                  />
                                </div>
                              ))}
                              <button onClick={() => addChoice(qi)} className="text-blue-600 text-sm mt-1">+ Add Choice</button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                </table>
              )}
            </Droppable>
          </DragDropContext>

          <div className="flex justify-between mt-6">
            <button onClick={addQuestion} className="bg-gray-100 px-4 py-2 rounded">➕ Add Question</button>
            <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded">✅ Save</button>
          </div>
        </>
      )}
    </div>
  );
}
