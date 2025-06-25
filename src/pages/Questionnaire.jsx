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
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!patient) navigate("/login");
  }, [patient, navigate]);

  const loadQuestions = async () => {
    if (!stage?.type || !stage?.range) return;
    setLoading(true);
    try {
      const snaps = await getDocs(
        query(
          collection(db, "questionnaires"),
          where("stageType", "==", stage.type),
          where("stageRange", "==", stage.range)
        )
      );
      const arr = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
      const map = Object.fromEntries(arr.map((q) => [q.id, q]));
      setLoadedQuestions(map);
      const root = arr.find((q) => q.isRoot);
      setCurrentId(root?.id ?? null);
    } catch (e) {
      console.error(e);
      setLoadError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage) loadQuestions();
    setAnswers({});
    setFlags([]);
    setFinished(false);
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
        return Array.from(new Set(flat)); // remove duplicates
      });
    }

    const nextId = choice.leadsTo && loadedQuestions[choice.leadsTo]
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
      .map(([cond, count]) => ({
        condition: cond,
        score: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.score - a.score);
  };

  const validateBeforeSubmit = ({ answers, flags, confidenceList }) => {
    const isFlatArray = (arr) => Array.isArray(arr) && !arr.some(Array.isArray);
    const isValidConfidenceList = Array.isArray(confidenceList) &&
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
        >
          🤰 Pregnant
        </button>
        <button
          onClick={() => setStage({ type: "postpartum" })}
          className="w-full bg-blue-100 p-2 rounded"
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
          onClick={loadQuestions}
          className="mt-4 px-4 py-2 bg-gray-200 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (finished) {
    const confList = calculateConfidence();
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold text-green-600 mb-4">
          ✅ Thank you!
        </h2>
        <p className="text-gray-600 mb-4">
          Your responses have been recorded.
        </p>
        <button
          onClick={submit}
          disabled={submitting}
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
        {current.choices.map((choice) => (
          <button
            key={choice.label}
            onClick={() => handlePick(choice)}
            className="block w-full bg-sky-100 p-2 rounded hover:bg-sky-200 transition"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
