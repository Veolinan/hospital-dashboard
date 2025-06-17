import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const STAGE_TYPES = ['pregnant', 'postpartum'];

const STAGE_RANGES = {
  pregnant: ['1–3 months', '4–6 months', '7–9 months'],
  postpartum: [
    '1–4 weeks',
    '4–8 weeks',
    '8–20 weeks',
    '6–9 months',
    '10–12 months',
  ],
};

const QuestionBuilder = () => {
  const [text, setText] = useState('');
  const [stageType, setStageType] = useState('pregnant');
  const [stageRange, setStageRange] = useState(STAGE_RANGES['pregnant'][0]);
  const [category, setCategory] = useState('general');
  const [choices, setChoices] = useState([{ label: '', leadsTo: '', flag: '' }]);
  const [isRoot, setIsRoot] = useState(true);
  const [order, setOrder] = useState(1);

  const handleChoiceChange = (index, field, value) => {
    const updated = [...choices];
    updated[index][field] = value;
    setChoices(updated);
  };

  const addChoice = () =>
    setChoices([...choices, { label: '', leadsTo: '', flag: '' }]);

  const handleSubmit = async () => {
    if (!text.trim()) return alert('Question text cannot be empty');

    try {
      await addDoc(collection(db, 'questionnaires'), {
        text,
        stageType,
        stageRange,
        category,
        choices,
        isRoot,
        order,
        timestamp: Date.now(),
      });

      alert('✅ Question saved!');
      setText('');
      setChoices([{ label: '', leadsTo: '', flag: '' }]);
    } catch (e) {
      alert('❌ Error saving: ' + e.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-4">🧠 Build a Questionnaire</h2>

      <input
        className="w-full mb-3 border p-2 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter question text"
      />

      <div className="mb-3 flex gap-3">
        <select
          value={stageType}
          onChange={(e) => {
            setStageType(e.target.value);
            setStageRange(STAGE_RANGES[e.target.value][0]);
          }}
          className="border p-2 rounded"
        >
          {STAGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={stageRange}
          onChange={(e) => setStageRange(e.target.value)}
          className="border p-2 rounded"
        >
          {STAGE_RANGES[stageType].map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>

        <input
          className="border p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. general, headache)"
        />
      </div>

      <label className="block mb-2">
        <input
          type="checkbox"
          checked={isRoot}
          onChange={(e) => setIsRoot(e.target.checked)}
          className="mr-2"
        />
        Is this a root (starting) question?
      </label>

      <label className="block mb-4">
        Order:
        <input
          type="number"
          className="border p-2 ml-2 w-20 rounded"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </label>

      <h3 className="text-lg font-semibold mt-4 mb-2">Choices</h3>
      {choices.map((c, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            placeholder="Label (e.g. Yes)"
            value={c.label}
            onChange={(e) => handleChoiceChange(i, 'label', e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <input
            placeholder="Leads To (optional)"
            value={c.leadsTo}
            onChange={(e) => handleChoiceChange(i, 'leadsTo', e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <input
            placeholder="Flag (optional)"
            value={c.flag}
            onChange={(e) => handleChoiceChange(i, 'flag', e.target.value)}
            className="border p-2 rounded flex-1"
          />
        </div>
      ))}

      <button
        onClick={addChoice}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Choice
      </button>

      <button
        onClick={handleSubmit}
        className="mt-4 block w-full px-4 py-2 bg-green-600 text-white rounded"
      >
        ✅ Save Question
      </button>
    </div>
  );
};

export default QuestionBuilder;
