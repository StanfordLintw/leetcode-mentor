'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Badge variant types are unused — difficulty uses className directly
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ChatMessage from '@/components/ai/ChatMessage';
import StreamingText from '@/components/ai/StreamingText';
import { cn } from '@/lib/utils';
import type { CodeReview, Message, WhiteboardFeedback, StudyPlanItem } from '@/lib/claude';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  description: string;
  constraints?: string[];
  tags?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HARD: 'text-red-400',
};

const DIFFICULTY_BADGE_CLASS: Record<string, string> = {
  EASY: 'border-green-700 bg-green-900/60 text-green-300',
  MEDIUM: 'border-yellow-700 bg-yellow-900/60 text-yellow-300',
  HARD: 'border-red-700 bg-red-900/60 text-red-300',
};

const CATEGORIES = [
  'ARRAY', 'STRING', 'LINKED_LIST', 'TREE', 'GRAPH', 'DYNAMIC_PROGRAMMING',
  'BACKTRACKING', 'BINARY_SEARCH', 'STACK_QUEUE', 'HASH_TABLE', 'MATH',
  'TWO_POINTERS', 'SLIDING_WINDOW', 'GREEDY', 'HEAP', 'TRIE',
];

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust'];

// ─── Problem Selector ─────────────────────────────────────────────────────────

function ProblemSelector({
  problems,
  selectedId,
  onSelect,
}: {
  problems: Problem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-zinc-400 text-xs uppercase tracking-wider">Problem</Label>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
          <SelectValue placeholder="Select a problem..." />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100 max-h-80">
          {problems.map(p => (
            <SelectItem key={p.id} value={p.id} className="focus:bg-zinc-700">
              <span className={cn('mr-2 text-xs font-semibold', DIFFICULTY_COLORS[p.difficulty])}>
                {p.difficulty}
              </span>
              {p.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Interview Mode ───────────────────────────────────────────────────────────

type InterviewStage = 'clarification' | 'approach' | 'coding' | 'analysis';

const STAGE_LABELS: Record<InterviewStage, string> = {
  clarification: 'Clarification',
  approach: 'Approach',
  coding: 'Coding',
  analysis: 'Analysis',
};

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
}

function InterviewTab({ problems }: { problems: Problem[] }) {
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [stage, setStage] = useState<InterviewStage>('clarification');
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [userInput, setUserInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedProblem = problems.find(p => p.id === selectedProblemId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const sendToAPI = useCallback(
    async (history: Message[]) => {
      if (!selectedProblem) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsStreaming(true);
      setStreamingContent('');

      try {
        const res = await fetch('/api/ai/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId: selectedProblem.id,
            stage,
            conversationHistory: history,
            problem: selectedProblem,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error((err as { error?: string }).error ?? 'Request failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingContent(accumulated);
        }

        setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
        setStreamingContent('');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
          ]);
          setStreamingContent('');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [selectedProblem, stage],
  );

  const handleStart = useCallback(async () => {
    if (!selectedProblem) return;
    setIsLoading(true);
    setMessages([]);
    setIsStarted(true);
    setStage('clarification');
    await sendToAPI([]);
    setIsLoading(false);
  }, [selectedProblem, sendToAPI]);

  const handleSend = useCallback(async () => {
    const text = userInput.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatEntry = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');

    await sendToAPI(newMessages.map(m => ({ role: m.role, content: m.content })));
  }, [userInput, isStreaming, messages, sendToAPI]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <ProblemSelector
            problems={problems}
            selectedId={selectedProblemId}
            onSelect={id => {
              setSelectedProblemId(id);
              setIsStarted(false);
              setMessages([]);
            }}
          />
        </div>
        <Button
          onClick={handleStart}
          disabled={!selectedProblemId || isLoading || isStreaming}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isStarted ? 'Restart Interview' : 'Start Interview'}
        </Button>
      </div>

      {/* Stage selector */}
      {isStarted && (
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(STAGE_LABELS) as InterviewStage[]).map((s, i) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                stage === s
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500',
              )}
            >
              {i + 1}. {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {!isStarted && (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              Select a problem and click &quot;Start Interview&quot; to begin your mock session.
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {isStreaming && streamingContent && (
            <ChatMessage role="assistant" content={streamingContent} isStreaming />
          )}
          {isStreaming && !streamingContent && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-200 font-bold">
                AI
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {isStarted && (
          <div className="border-t border-zinc-800 p-3 flex gap-2 items-end">
            <Textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response... (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="flex-1 resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-blue-600 min-h-[60px]"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!userInput.trim() || isStreaming}
              className="bg-blue-600 hover:bg-blue-700 text-white h-[60px] px-5"
            >
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Whiteboard Mode ──────────────────────────────────────────────────────────

function WhiteboardTab({ problems }: { problems: Problem[] }) {
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [explanation, setExplanation] = useState('');
  const [feedback, setFeedback] = useState<WhiteboardFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedProblem = problems.find(p => p.id === selectedProblemId);

  const handleSubmit = async () => {
    if (!selectedProblem || !explanation.trim()) return;
    setIsLoading(true);
    setError('');
    setFeedback(null);

    try {
      const res = await fetch('/api/ai/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          explanation: explanation.trim(),
          problem: selectedProblem,
        }),
      });

      const data = await res.json() as WhiteboardFeedback & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setFeedback(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreColor = feedback
    ? feedback.score >= 80
      ? 'text-green-400'
      : feedback.score >= 60
        ? 'text-yellow-400'
        : 'text-red-400'
    : '';

  return (
    <div className="flex flex-col gap-4">
      <ProblemSelector
        problems={problems}
        selectedId={selectedProblemId}
        onSelect={id => {
          setSelectedProblemId(id);
          setFeedback(null);
        }}
      />

      {selectedProblem && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-zinc-400 mb-1">
              <Badge className={cn('mr-2 text-xs border', DIFFICULTY_BADGE_CLASS[selectedProblem.difficulty])}>
                {selectedProblem.difficulty}
              </Badge>
              {selectedProblem.category.replace(/_/g, ' ')}
            </p>
            <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">
              {selectedProblem.description}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-1">
        <Label className="text-zinc-400 text-xs uppercase tracking-wider">
          Your Approach (no code!)
        </Label>
        <Textarea
          value={explanation}
          onChange={e => setExplanation(e.target.value)}
          placeholder="Describe your approach in plain English. Walk through your thought process: How would you break down the problem? What data structures would you use and why? What is the overall algorithm? What are the edge cases? How does it perform?"
          rows={8}
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-blue-600 resize-none"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selectedProblemId || !explanation.trim() || isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
      >
        {isLoading ? 'Evaluating...' : 'Evaluate Explanation'}
      </Button>

      {error && (
        <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {feedback && (
        <div className="flex flex-col gap-4">
          {/* Score + approach correctness */}
          <div className="flex gap-4">
            <Card className="bg-zinc-800 border-zinc-700 flex-1">
              <CardContent className="pt-4 pb-3 text-center">
                <div className={cn('text-5xl font-bold', scoreColor)}>{feedback.score}</div>
                <div className="text-zinc-400 text-xs mt-1">/ 100</div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'flex-1 border',
                feedback.correctApproach
                  ? 'bg-green-950 border-green-800'
                  : 'bg-red-950 border-red-800',
              )}
            >
              <CardContent className="pt-4 pb-3 text-center">
                <div
                  className={cn(
                    'text-3xl font-bold',
                    feedback.correctApproach ? 'text-green-400' : 'text-red-400',
                  )}
                >
                  {feedback.correctApproach ? 'Correct' : 'Incorrect'}
                </div>
                <div className="text-zinc-400 text-xs mt-1">approach</div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm text-zinc-300">Overall Feedback</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-zinc-300 text-sm leading-relaxed">{feedback.feedback}</p>
            </CardContent>
          </Card>

          {/* Missing points */}
          {feedback.missingPoints.length > 0 && (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm text-zinc-300">Missing Points</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5">
                  {feedback.missingPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                      <span className="text-red-400 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {feedback.suggestions.length > 0 && (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm text-zinc-300">Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5">
                  {feedback.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                      <span className="text-blue-400 mt-0.5">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Code Review Tab ──────────────────────────────────────────────────────────

function CodeReviewTab({ problems }: { problems: Problem[] }) {
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Python');
  const [review, setReview] = useState<CodeReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedProblem = problems.find(p => p.id === selectedProblemId);

  const handleReview = async () => {
    if (!selectedProblem || !code.trim()) return;
    setIsLoading(true);
    setError('');
    setReview(null);

    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          code: code.trim(),
          language,
          problem: selectedProblem,
        }),
      });

      const data = await res.json() as CodeReview & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreColor = review
    ? review.score >= 80
      ? 'bg-green-600'
      : review.score >= 60
        ? 'bg-yellow-600'
        : 'bg-red-600'
    : 'bg-zinc-600';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <ProblemSelector
            problems={problems}
            selectedId={selectedProblemId}
            onSelect={id => {
              setSelectedProblemId(id);
              setReview(null);
            }}
          />
        </div>
        <div className="flex flex-col gap-1 w-36">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
              {LANGUAGES.map(l => (
                <SelectItem key={l} value={l} className="focus:bg-zinc-700">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-zinc-400 text-xs uppercase tracking-wider">Your Code</Label>
        <Textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={`Paste your ${language} solution here...`}
          rows={14}
          className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-600 resize-none font-mono text-sm"
        />
      </div>

      <Button
        onClick={handleReview}
        disabled={!selectedProblemId || !code.trim() || isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
      >
        {isLoading ? 'Reviewing...' : 'Review Code'}
      </Button>

      {error && (
        <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {review && (
        <div className="flex flex-col gap-4">
          {/* Score row */}
          <div className="flex gap-3 flex-wrap">
            <div
              className={cn(
                'rounded-xl px-5 py-3 text-white text-center min-w-[90px]',
                scoreColor,
              )}
            >
              <div className="text-4xl font-bold">{review.score}</div>
              <div className="text-xs opacity-80 mt-0.5">Score</div>
            </div>
            <Card className="bg-zinc-800 border-zinc-700 flex-1">
              <CardContent className="pt-3 pb-3 flex gap-6">
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Time</div>
                  <div className="text-zinc-200 font-mono font-semibold">{review.timeComplexity}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Space</div>
                  <div className="text-zinc-200 font-mono font-semibold">{review.spaceComplexity}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Optimal</div>
                  <div
                    className={cn(
                      'font-semibold',
                      review.isOptimal ? 'text-green-400' : 'text-yellow-400',
                    )}
                  >
                    {review.isOptimal ? 'Yes' : 'Not yet'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm text-zinc-300">Feedback</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-zinc-300 text-sm leading-relaxed">{review.feedback}</p>
            </CardContent>
          </Card>

          {/* Improvements */}
          {review.improvements.length > 0 && (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm text-zinc-300">Improvements</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-2">
                  {review.improvements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-900 text-blue-300 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Study Planner Tab ────────────────────────────────────────────────────────

function StudyPlannerTab() {
  const [weakCategories, setWeakCategories] = useState<string[]>([]);
  const [targetDays, setTargetDays] = useState(14);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [plan, setPlan] = useState<StudyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCategory = (cat: string) => {
    setWeakCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  const handleGenerate = async () => {
    if (weakCategories.length === 0) {
      setError('Please select at least one weak category.');
      return;
    }
    setIsLoading(true);
    setError('');
    setPlan([]);

    try {
      const res = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weakCategories,
          targetDays,
          currentLevel: level,
        }),
      });

      const data = await res.json() as StudyPlanItem[] | { error?: string };
      if (!res.ok) throw new Error(('error' in data ? data.error : undefined) ?? 'Request failed');
      setPlan(data as StudyPlanItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-zinc-200 text-base">Configure Your Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Weak categories */}
          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              Weak Categories (select all that apply)
            </Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    weakCategories.includes(cat)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-zinc-900 border-zinc-600 text-zinc-400 hover:border-zinc-400',
                  )}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Target days */}
          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              Study Duration: <span className="text-zinc-200 font-semibold">{targetDays} days</span>
            </Label>
            <input
              type="range"
              min={3}
              max={90}
              value={targetDays}
              onChange={e => setTargetDays(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>3 days</span>
              <span>90 days</span>
            </div>
          </div>

          {/* Level */}
          <div className="flex flex-col gap-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Current Level</Label>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-colors',
                    level === l
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-zinc-900 border-zinc-600 text-zinc-400 hover:border-zinc-400',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={weakCategories.length === 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-2"
          >
            {isLoading ? 'Generating Plan...' : 'Generate Study Plan'}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan output */}
      {plan.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-zinc-200 font-semibold text-base">
            Your {targetDays}-Day Plan
            <span className="ml-2 text-xs text-zinc-500 font-normal">
              ({plan.length} days scheduled)
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left text-zinc-400 font-medium py-2 pr-4 w-16">Day</th>
                  <th className="text-left text-zinc-400 font-medium py-2 pr-4">Focus</th>
                  <th className="text-left text-zinc-400 font-medium py-2 pr-4">Problems</th>
                  <th className="text-left text-zinc-400 font-medium py-2">Goal</th>
                </tr>
              </thead>
              <tbody>
                {plan.map(item => (
                  <tr
                    key={item.day}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-900 text-blue-300 text-xs font-bold">
                        {item.day}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300 font-medium">{item.focus}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {item.problemSlugs.map(slug => (
                          <a
                            key={slug}
                            href={`https://leetcode.com/problems/${slug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline text-xs font-mono"
                          >
                            {slug}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-zinc-400 text-xs">{item.goal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Concept Explainer ────────────────────────────────────────────────────────

function ConceptExplainerTab() {
  const [concept, setConcept] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const POPULAR_CONCEPTS = [
    'Dynamic Programming', 'Two Pointers', 'Sliding Window', 'Binary Search',
    'DFS & BFS', 'Backtracking', 'Trie', 'Heap / Priority Queue',
    'Union Find', 'Monotonic Stack', 'Segment Tree', 'Topological Sort',
  ];

  const handleExplain = async (conceptToUse?: string) => {
    const target = (conceptToUse ?? concept).trim();
    if (!target) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsStreaming(true);
    setStreamedText('');
    setError('');
    if (!conceptToUse) setConcept(target);

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: target, level }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error((err as { error?: string }).error ?? 'Request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamedText(accumulated);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Concept</Label>
          <Input
            value={concept}
            onChange={e => setConcept(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleExplain()}
            placeholder="e.g. Dynamic Programming, Binary Search, Trie..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-blue-600"
          />
        </div>
        <div className="flex flex-col gap-1 w-40">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Level</Label>
          <Select value={level} onValueChange={v => setLevel(v as typeof level)}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectItem value="beginner" className="focus:bg-zinc-700">Beginner</SelectItem>
              <SelectItem value="intermediate" className="focus:bg-zinc-700">Intermediate</SelectItem>
              <SelectItem value="advanced" className="focus:bg-zinc-700">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => handleExplain()}
          disabled={!concept.trim() || isStreaming}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isStreaming ? 'Explaining...' : 'Explain'}
        </Button>
      </div>

      {/* Popular concepts chips */}
      <div className="flex flex-wrap gap-2">
        {POPULAR_CONCEPTS.map(c => (
          <button
            key={c}
            onClick={() => {
              setConcept(c);
              handleExplain(c);
            }}
            className="px-3 py-1 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {c}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {(streamedText || isStreaming) && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-4">
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed">
              {isStreaming ? (
                <StreamingText text={streamedText} showCursor />
              ) : (
                <div className="whitespace-pre-wrap">{streamedText}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);

  useEffect(() => {
    fetch('/api/problems?limit=100')
      .then(r => r.json())
      .then((data: { problems?: Problem[] } | Problem[]) => {
        // The existing API returns { problems, total, page, totalPages }
        const list = Array.isArray(data) ? data : (data as { problems?: Problem[] }).problems ?? [];
        setProblems(list);
      })
      .catch(console.error)
      .finally(() => setIsLoadingProblems(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            AI
          </div>
          <div>
            <h1 className="font-semibold text-zinc-100 leading-none">AI Mentor</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Powered by Claude</p>
          </div>
          {isLoadingProblems && (
            <span className="ml-auto text-xs text-zinc-500 animate-pulse">Loading problems...</span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="interview" className="w-full">
          <TabsList className="bg-zinc-800 border border-zinc-700 w-full mb-6 h-auto p-1 flex flex-wrap gap-1">
            <TabsTrigger
              value="interview"
              className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400"
            >
              Interview Mode
            </TabsTrigger>
            <TabsTrigger
              value="whiteboard"
              className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400"
            >
              Whiteboard Mode
            </TabsTrigger>
            <TabsTrigger
              value="review"
              className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400"
            >
              Code Review
            </TabsTrigger>
            <TabsTrigger
              value="planner"
              className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400"
            >
              Study Planner
            </TabsTrigger>
            <TabsTrigger
              value="explain"
              className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400"
            >
              Concept Explainer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interview" className="min-h-[600px] flex flex-col">
            <InterviewTab problems={problems} />
          </TabsContent>

          <TabsContent value="whiteboard">
            <WhiteboardTab problems={problems} />
          </TabsContent>

          <TabsContent value="review">
            <CodeReviewTab problems={problems} />
          </TabsContent>

          <TabsContent value="planner">
            <StudyPlannerTab />
          </TabsContent>

          <TabsContent value="explain">
            <ConceptExplainerTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
