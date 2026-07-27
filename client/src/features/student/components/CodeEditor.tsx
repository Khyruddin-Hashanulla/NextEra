import { useState, useRef, useEffect } from 'react';
import type { ProgrammingLanguage } from '@/types/coding';

const languageOptions: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const templates: Record<string, string> = {
  javascript: 'function solution(input) {\n  // Your code here\n  return input;\n}\n',
  python: 'def solution(input):\n    # Your code here\n    return input\n',
  typescript: 'function solution(input: string): string {\n  // Your code here\n  return input;\n}\n',
  java: 'public class Solution {\n  public static String solution(String input) {\n    // Your code here\n    return input;\n  }\n}\n',
  cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nstring solution(string input) {\n  // Your code here\n  return input;\n}\n',
  go: 'package main\n\nfunc solution(input string) string {\n  // Your code here\n  return input\n}\n',
  rust: 'fn solution(input: &str) -> String {\n  // Your code here\n  input.to_string()\n}\n',
};

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: ProgrammingLanguage;
  onLanguageChange: (lang: ProgrammingLanguage) => void;
  supportedLanguages: ProgrammingLanguage[];
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  supportedLanguages,
  readOnly = false,
  height = '400px',
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const filteredLanguages = languageOptions.filter(l => supportedLanguages.includes(l.value));

  useEffect(() => {
    if (value && !value.trim()) {
      const template = templates[language] || '';
      onChange(template);
    }
  }, [language]);

  useEffect(() => {
    setLineCount((value.match(/\n/g) || []).length + 1);
  }, [value]);

  return (
    <div className="rounded-lg border bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as ProgrammingLanguage)}
          className="bg-zinc-900 text-zinc-100 text-xs rounded px-2 py-1 border border-zinc-700"
        >
          {filteredLanguages.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">{language}</span>
      </div>
      <div className="flex" style={{ minHeight: height }}>
        <div className="select-none px-2 py-3 text-right text-xs leading-5 text-zinc-600 border-r border-zinc-800 bg-zinc-900 min-w-[3rem]">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className="flex-1 bg-zinc-950 text-zinc-100 text-sm leading-5 p-3 outline-none resize-none font-mono"
          style={{ minHeight: height, tabSize: 2 }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
