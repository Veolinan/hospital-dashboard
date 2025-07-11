// src/pages/Questionnaire.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Questionnaire() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const patient = state?.patient;

  const [stage, setStage] = useState(null);
  const [loadedQuestions, setLoadedQuestions] = useState({});
  const [currentId, setCurrentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [riskLevels, setRiskLevels] = useState([]);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!patient) navigate("/login");
  }, [patient, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!stage?.type || !stage?.range) return;
      setLoading(true);
      setLoadError(null);
      try {
        const snaps = await getDocs(
          query(
            collection(db, "questionnaires"),
            where("stageType", "==", stage.type),
            where("stageRange", "==", stage.range)
          )
        );
        const arr = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
        const map = {};
        arr.forEach(q => {
          q.questions.forEach(qObj => {
            map[qObj.id] = qObj;
          });
        });
        setLoadedQuestions(map);
        const root = Object.values(map).find(q => q.isRoot);
        setCurrentId(root?.id ?? null);
      } catch (e) {
        console.error(e);
        setLoadError("Failed to load questions.");
      } finally {
        setLoading(false);
      }
    };

    if (stage) {
      setAnswers({});
      setFlags([]);
      setRiskLevels([]);
      setTotalWeight(0);
      setFinished(false);
      load();
    }
  }, [stage]);

  const flattenArray = (arr) => {
    return arr.reduce((acc, val) => {
      if (Array.isArray(val)) {
        acc.push(...flattenArray(val));
      } else {
        acc.push(val);
      }
      return acc;
    }, []);
  };

  const handlePick = (choice) => {
    if (!currentId) return;
    setAnswers((a) => ({ ...a, [currentId]: choice.label }));

    if (choice.flag) {
      setFlags((prev) => {
        const flat = flattenArray([...prev, choice.flag]);
        return Array.from(new Set(flat));
      });
    }

    if (choice.weight) {
      setTotalWeight(prev => prev + parseInt(choice.weight));
    }

    if (choice.riskLevel) {
      setRiskLevels(prev => [...prev, choice.riskLevel]);
    }

    const nextId =
      choice.leadsTo && loadedQuestions[choice.leadsTo]
        ? choice.leadsTo
        : null;
    nextId ? setCurrentId(nextId) : setFinished(true);
  };

  const calculateConfidence = () => {
    const total = flags.length;
    if (total === 0) return [];
    const counts = flags.reduce((acc, f) => {
      acc[f] = (acc[f] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([condition, count]) => ({
        condition,
        score: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.score - a.score);
  };

  const classifyRisk = () => {
    const count = { low: 0, alert: 0, danger: 0 };
    for (const level of riskLevels) {
      count[level] = (count[level] || 0) + 1;
    }
    if (count.danger > 0) return "Danger Zone";
    if (count.alert > 0) return "Alert Zone";
    return "Low Risk";
  };

  const validateBeforeSubmit = ({ answers, flags, confidenceList }) => {
    const isFlatArray = (arr) => Array.isArray(arr) && !arr.some(Array.isArray);
    const isValidConfidenceList =
      Array.isArray(confidenceList) &&
      confidenceList.every(
        (c) => typeof c.condition === "string" && typeof c.score === "number"
      );

    if (typeof answers !== "object" || Array.isArray(answers)) {
      return "Answers must be a flat object.";
    }

    if (!isFlatArray(flags)) {
      return "Flags must be a flat array.";
    }

    if (!isValidConfidenceList) {
      return "Confidence list must be an array of {condition, score}.";
    }

    return null;
  };

  const submit = async () => {
    const flattenedFlags = flattenArray(flags);
    const confList = calculateConfidence();
    const suggested = confList[0]?.condition || "None";

    const validationError = validateBeforeSubmit({
      answers,
      flags: flattenedFlags,
      confidenceList: confList,
    });

    if (validationError) {
      alert(`❌ Invalid submission: ${validationError}`);
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "questionnaire_responses"), {
        patientId: patient.id,
        patientName: patient.fullName,
        stage,
        answers,
        flags: flattenedFlags,
        confidenceList: confList,
        suggestedCondition: suggested,
        totalWeight,
        riskClassification: classifyRisk(),
        status: "submitted",
        submittedAt: serverTimestamp(),
      });

      await auth.signOut();
      navigate("/");
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Error submitting. Please try again.");
      setSubmitting(false);
    }
  };

  if (!stage) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Are you:</h2>
        <button
          onClick={() => setStage({ type: "pregnant" })}
          className="mb-2 w-full bg-green-100 p-2 rounded"
          disabled={loading || submitting}
        >
          🤰 Pregnant
        </button>
        <button
          onClick={() => setStage({ type: "postpartum" })}
          className="w-full bg-blue-100 p-2 rounded"
          disabled={loading || submitting}
        >
          🍼 Postpartum
        </button>
      </div>
    );
  }

  if (stage.type && !stage.range) {
    const ranges =
      stage.type === "pregnant"
        ? ["1–3 months", "4–6 months", "7–9 months"]
        : ["1–4 weeks", "4–8 weeks", "8–20 weeks", "6–9 months", "10–12 months"];
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Which stage?</h2>
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setStage({ ...stage, range: r })}
            className="mb-2 w-full bg-gray-100 p-2 rounded"
            disabled={loading || submitting}
          >
            {r}
          </button>
        ))}
      </div>
    );
  }

  if (loading) {
    return <p className="p-6 text-center">⏳ Loading questions...</p>;
  }

  if (loadError) {
    return (
      <div className="p-6 max-w-md mx-auto text-red-600">
        <p>{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-200 rounded"
          disabled={loading || submitting}
        >
          Retry
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold text-green-600 mb-4">✅ Thank you!</h2>
        <p className="text-gray-600 mb-4">Your responses have been recorded.</p>
        <button
          onClick={submit}
          disabled={submitting || loading}
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          {submitting ? "Submitting..." : "Finish & Logout"}
        </button>
      </div>
    );
  }

  const current = loadedQuestions[currentId];

  if (!current) {
    return (
      <div className="p-6 text-center text-red-600">
        Error: Invalid or missing question. Please restart.
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-200 rounded"
          disabled={loading || submitting}
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <p className="text-gray-500 mb-1">
        Stage: {stage.type} — {stage.range}
      </p>
      <h2 className="mb-4 text-lg font-semibold">{current.text}</h2>
      <div className="space-y-2">
        {current.choices.map((choice, idx) => (
          <button
            key={`${choice.label}-${idx}`}
            onClick={() => handlePick(choice)}
            className="block w-full bg-sky-100 p-2 rounded hover:bg-sky-200 transition"
            disabled={submitting || loading}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
