import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const Questionnaire = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const patient = state?.patient;

  const [stage, setStage] = useState(null); // { type, range }
  const [step, setStep] = useState(0); // 0=choose stage, 1=range, 2=start questions
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!patient) return navigate('/login-patient');
  }, [patient, navigate]);

  useEffect(() => {
    const fetchRootQuestion = async () => {
      if (!stage) return;
      const q = query(
        collection(db, 'questionnaires'),
        where('stageType', '==', stage.type),
        where('stageRange', '==', stage.range),
        where('isRoot', '==', true)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const rootDoc = snap.docs[0];
        setQuestions([{ id: rootDoc.id, ...rootDoc.data() }]);
        setStep(2);
      } else {
        console.error("No root question found");
      }
    };
    fetchRootQuestion();
  }, [stage]);

  const handleAnswer = async (label) => {
    const q = questions[currentIndex];
    const choice = q.choices.find(c => c.label === label);
    if (!choice) return;

    setAnswers(prev => ({ ...prev, [q.id]: label }));
    if (choice.flag) setFlags(prev => [...prev, choice.flag]);

    if (choice.leadsTo) {
      const nextSnap = await getDocs(
        query(collection(db, 'questionnaires'), where("__name__", "==", choice.leadsTo))
      );
      if (!nextSnap.empty) {
        setQuestions(prev => [...prev, { id: nextSnap.docs[0].id, ...nextSnap.docs[0].data() }]);
        setCurrentIndex(prev => prev + 1);
        return;
      }
    }

    // No further questions
    setFinished(true);
  };

  const handleSubmit = async () => {
  const responseData = {
    patientId: patient.id,
    patientName: patient.fullName,
    hospitalId: patient.hospitalId || null,
    stage,
    responses: answers,
    flags,
    submittedAt: serverTimestamp()
  };

  if (patient.registeredBy) {
    responseData.doctorId = patient.registeredBy;
  }

  await addDoc(collection(db, 'responses'), responseData);

  auth.signOut();
  navigate('/');
};


  // Step 0: Choose if pregnant or postpartum
  if (step === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h2 className="text-lg font-bold mb-4">Are you currently:</h2>
          <button onClick={() => { setStage({ type: 'pregnant' }); setStep(1); }}
            className="w-full bg-emerald-100 hover:bg-emerald-200 px-4 py-2 mb-3 rounded">
            🤰 Pregnant
          </button>
          <button onClick={() => { setStage({ type: 'postpartum' }); setStep(1); }}
            className="w-full bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded">
            🍼 Postpartum
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Choose stage range
  if (step === 1) {
    const ranges = stage.type === 'pregnant'
      ? ["1–3 months", "4–6 months", "7–9 months"]
      : ["0–6 days", "1–6 weeks", "7+ weeks"];
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h2 className="text-lg font-bold mb-4">Which stage best describes you?</h2>
          {ranges.map((r, i) => (
            <button
              key={i}
              onClick={() => setStage(prev => ({ ...prev, range: r }))}
              className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-2 mb-3 rounded">
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Display questions
  if (step === 2 && finished) {
    return (
      <div className="min-h-screen flex justify-center items-center px-4">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-green-700">✅ Thank you for completing the questionnaire.</h2>
          {flags.length > 0 && (
            <>
              <h3 className="text-red-600 font-semibold mb-2">Please take note:</h3>
              <ul className="list-disc ml-5 mb-4 text-sm">
                {flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </>
          )}
          <button onClick={handleSubmit}
            className="w-full bg-emerald-600 text-white px-4 py-2 rounded">
            Finish and Log Out
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  if (!current) return <p className="text-center mt-10">Loading questionnaire...</p>;

  return (
    <div className="min-h-screen flex justify-center items-center px-4 py-10">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-xl w-full">
        <p className="text-lg font-semibold mb-4">{current.text}</p>
        <div className="space-y-3">
          {current.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(c.label)}
              className="block w-full bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
