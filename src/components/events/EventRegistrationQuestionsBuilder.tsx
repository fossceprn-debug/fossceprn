import React from "react";
import { Plus, Trash2, HelpCircle, Check, ListPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RegistrationQuestion, QuestionType } from "@/types";

interface EventRegistrationQuestionsBuilderProps {
  questions: RegistrationQuestion[];
  onChange: (questions: RegistrationQuestion[]) => void;
}

export const EventRegistrationQuestionsBuilder: React.FC<EventRegistrationQuestionsBuilderProps> = ({
  questions,
  onChange,
}) => {
  const handleAddQuestion = () => {
    const newQ: RegistrationQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    };
    onChange([...questions, newQ]);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<RegistrationQuestion>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const handleRemoveQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ListPlus className="w-4 h-4 text-emerald-600" />
            <span>On-site Registration Questions Builder</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure questions attendees must answer during on-site registration.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddQuestion}
          className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Question</span>
        </Button>
      </div>

      {/* Built-in default fields indicator */}
      <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 space-y-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Default Pre-Configured Questions (Always Collected)</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {["Full Name", "Email Address", "Phone / WhatsApp", "Class, Semester & Branch"].map(
            (field, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                {field}
              </span>
            )
          )}
        </div>
      </div>

      {/* Custom Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-4 px-3 rounded-xl border border-dashed border-slate-200 bg-white/50 text-[11px] text-slate-400">
          No extra questions added. Click <strong>"Add Custom Question"</strong> if you need additional details like laptop availability, experience level, or dietary preferences.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Question #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Remove question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-7">
                  <Input
                    required
                    placeholder="e.g. Do you have a personal laptop with Linux installed?"
                    value={q.label}
                    onChange={(e) => handleUpdateQuestion(q.id, { label: e.target.value })}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={q.type}
                    onChange={(e) =>
                      handleUpdateQuestion(q.id, { type: e.target.value as QuestionType })
                    }
                    className="h-8 w-full px-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Answer</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown Choice</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center justify-end">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => handleUpdateQuestion(q.id, { required: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span>Required</span>
                  </label>
                </div>
              </div>

              {/* Dropdown Options (if select type) */}
              {q.type === "select" && (
                <div className="pt-1">
                  <Input
                    placeholder="Dropdown options separated by commas (e.g. Beginner, Intermediate, Expert)"
                    value={(q.options || []).join(", ")}
                    onChange={(e) =>
                      handleUpdateQuestion(q.id, {
                        options: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="h-8 text-xs rounded-lg font-sans"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Separate each choice with a comma.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
