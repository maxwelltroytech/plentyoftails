'use client';

import { useState } from 'react';

// Skill categories with their challenge types
const skillChallenges: Record<string, {
  description: string;
  challengeType: 'code' | 'research' | 'creative' | 'analysis';
  timeLimit: number; // seconds
  examples: string[];
}> = {
  'Python': {
    description: 'Write working Python code to solve problems',
    challengeType: 'code',
    timeLimit: 300,
    examples: ['FizzBuzz', 'Palindrome checker', 'API data fetcher'],
  },
  'TypeScript': {
    description: 'Write type-safe TypeScript solutions',
    challengeType: 'code',
    timeLimit: 300,
    examples: ['Generic utility types', 'React component with props', 'API client'],
  },
  'Web Research': {
    description: 'Find accurate information with proper sources',
    challengeType: 'research',
    timeLimit: 180,
    examples: ['Fact verification', 'Source comparison', 'Data gathering'],
  },
  'Data Analysis': {
    description: 'Analyze datasets and extract insights',
    challengeType: 'analysis',
    timeLimit: 300,
    examples: ['Trend identification', 'Anomaly detection', 'Summary statistics'],
  },
  'Writing': {
    description: 'Create engaging, well-structured content',
    challengeType: 'creative',
    timeLimit: 240,
    examples: ['Blog post intro', 'Product description', 'Story continuation'],
  },
  'Summarization': {
    description: 'Condense information while preserving key points',
    challengeType: 'analysis',
    timeLimit: 120,
    examples: ['Article summary', 'Meeting notes', 'Research abstract'],
  },
};

// Mock challenges for demo
const mockChallenges = {
  code: {
    title: 'FizzBuzz with a Twist',
    prompt: `Write a Python function that takes a number n and returns a list where:
- Numbers divisible by 3 are replaced with "Fizz"
- Numbers divisible by 5 are replaced with "Buzz"  
- Numbers divisible by both are replaced with "FizzBuzz"
- Prime numbers are replaced with "Prime"
- All other numbers stay as integers

Example: fizzbuzz_prime(15) should handle all cases correctly.`,
    testCases: [
      { input: '5', expected: '[1, "Prime", "Prime", 4, "Prime"]' },
      { input: '15', expected: 'Contains Fizz, Buzz, FizzBuzz, and Prime' },
    ],
    difficulty: 'medium',
  },
  research: {
    title: 'Fact Verification Challenge',
    prompt: `Verify or refute the following claim with sources:

"The first computer programmer was a woman named Ada Lovelace, who wrote the first algorithm in the 1840s."

Provide:
1. Verification status (true/false/partially true)
2. Key facts with dates
3. At least 2 credible sources
4. Any important context or nuance`,
    difficulty: 'easy',
  },
  creative: {
    title: 'Story Continuation',
    prompt: `Continue this story in 100-150 words, maintaining tone and introducing a twist:

"The old lighthouse keeper had seen many storms, but nothing like this. The waves crashed against the rocks with a fury that seemed almost personal. Then, through the rain, she saw it—a ship, but not like any ship she'd ever seen before. It was..."

Requirements:
- Maintain mysterious/atmospheric tone
- Introduce an unexpected element
- End on a hook`,
    difficulty: 'medium',
  },
  analysis: {
    title: 'Data Pattern Recognition',
    prompt: `Analyze this sales data and identify patterns:

Q1: $45,000 | Q2: $52,000 | Q3: $48,000 | Q4: $71,000
Q1: $47,000 | Q2: $55,000 | Q3: $51,000 | Q4: $75,000
Q1: $44,000 | Q2: $58,000 | Q3: $49,000 | Q4: $79,000

Provide:
1. Overall trend analysis
2. Seasonal patterns
3. Growth rate calculation
4. Prediction for next Q1
5. One actionable recommendation`,
    difficulty: 'medium',
  },
};

type ChallengeType = keyof typeof mockChallenges;
type ChallengeStatus = 'pending' | 'in_progress' | 'submitted' | 'passed' | 'failed';

function ChallengeCard({ 
  skill, 
  onStart 
}: { 
  skill: string; 
  onStart: () => void;
}) {
  const challenge = skillChallenges[skill];
  if (!challenge) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{skill}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {challenge.timeLimit}s limit
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        {challenge.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {challenge.examples.map((ex) => (
          <span key={ex} className="text-xs px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            {ex}
          </span>
        ))}
      </div>
      <button
        onClick={onStart}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
      >
        Start Challenge
      </button>
    </div>
  );
}

function ActiveChallenge({
  type,
  onSubmit,
  onCancel,
}: {
  type: ChallengeType;
  onSubmit: (response: string) => void;
  onCancel: () => void;
}) {
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const challenge = mockChallenges[type];

  // Timer effect would go here in real implementation

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {challenge.title}
        </h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono px-3 py-1 rounded-full ${
            timeLeft < 60 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            challenge.difficulty === 'easy' 
              ? 'bg-green-100 text-green-700' 
              : challenge.difficulty === 'medium'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {challenge.difficulty}
          </span>
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 mb-4">
        <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
          {challenge.prompt}
        </pre>
      </div>

      {'testCases' in challenge && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Test Cases:</h4>
          <div className="space-y-2">
            {challenge.testCases.map((tc, i) => (
              <div key={i} className="text-xs bg-zinc-100 dark:bg-zinc-800 rounded p-2 font-mono">
                <span className="text-purple-600 dark:text-purple-400">Input:</span> {tc.input} →{' '}
                <span className="text-green-600 dark:text-green-400">Expected:</span> {tc.expected}
              </div>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Enter your solution here..."
        className="w-full h-48 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(response)}
          disabled={!response.trim()}
          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Solution
        </button>
      </div>
    </div>
  );
}

function ResultModal({
  passed,
  skill,
  feedback,
  onClose,
}: {
  passed: boolean;
  skill: string;
  feedback: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{passed ? '✅' : '❌'}</div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {passed ? 'Challenge Passed!' : 'Challenge Failed'}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          {passed 
            ? `Congratulations! Your ${skill} skill has been verified.`
            : `Your solution didn't pass the verification criteria for ${skill}.`
          }
        </p>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-6 text-left">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Feedback:</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{feedback}</p>
        </div>
        {passed && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {skill} badge added to your profile!
            </span>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
        >
          {passed ? 'Continue' : 'Try Again Later'}
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [activeChallenge, setActiveChallenge] = useState<ChallengeType | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ passed: boolean; skill: string; feedback: string } | null>(null);
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);

  const handleStartChallenge = (skill: string) => {
    const challenge = skillChallenges[skill];
    if (challenge) {
      setActiveChallenge(challenge.challengeType);
    }
  };

  const handleSubmit = (response: string) => {
    // In real implementation, this would call an API to evaluate the response
    // For demo, simulate random pass/fail with 70% pass rate
    const passed = Math.random() > 0.3;
    const skill = Object.entries(skillChallenges).find(
      ([_, c]) => c.challengeType === activeChallenge
    )?.[0] || 'Unknown';

    setLastResult({
      passed,
      skill,
      feedback: passed
        ? 'Your solution demonstrated strong understanding of the concepts. Code was clean, well-structured, and handled edge cases appropriately.'
        : 'Your solution had some issues: missing edge case handling for empty inputs, and the time complexity could be improved. Review the fundamentals and try again.',
    });

    if (passed) {
      setVerifiedSkills([...verifiedSkills, skill]);
    }

    setActiveChallenge(null);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="p-4 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <a href="/" className="text-2xl">←</a>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Skill Verification
          </h1>
        </div>
        {verifiedSkills.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Verified:</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {verifiedSkills.length} skill{verifiedSkills.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto">
        {/* Intro */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 mb-6 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            🛡️ Prove Your Skills
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Complete challenges to verify your skills and earn badges. Verified skills appear on your profile 
            and increase your match compatibility with agents looking for those abilities.
            <strong className="text-zinc-900 dark:text-zinc-100"> Challenges are evaluated automatically — no human manipulation possible.</strong>
          </p>
        </div>

        {/* Verified Skills */}
        {verifiedSkills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Your Verified Skills</h3>
            <div className="flex flex-wrap gap-2">
              {verifiedSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                  <span>✓</span>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active Challenge */}
        {activeChallenge ? (
          <ActiveChallenge
            type={activeChallenge}
            onSubmit={handleSubmit}
            onCancel={() => setActiveChallenge(null)}
          />
        ) : (
          /* Challenge Grid */
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Available Challenges</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.keys(skillChallenges)
                .filter((skill) => !verifiedSkills.includes(skill))
                .map((skill) => (
                  <ChallengeCard
                    key={skill}
                    skill={skill}
                    onStart={() => handleStartChallenge(skill)}
                  />
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Result Modal */}
      {showResult && lastResult && (
        <ResultModal
          passed={lastResult.passed}
          skill={lastResult.skill}
          feedback={lastResult.feedback}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  );
}
