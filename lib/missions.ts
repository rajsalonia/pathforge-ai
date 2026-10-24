/** Curated exercises. Static content is never represented as AI generated. */
export type MissionType = 'coding' | 'debugging' | 'sql' | 'algorithm' | 'project' | 'review' | 'git' | 'incident' | 'documentation' | 'teach-back' | 'story' | 'real-world' | 'roleplay' | 'collaborative' | 'revision' | 'experiment' | 'simulation';
export type Mission = {
  id: string; title: string; titleHi: string; skill: string; type: MissionType;
  minutes: number; xp: number; difficulty: 'Beginner' | 'Intermediate';
  objective: string; objectiveHi: string; instructions: string; instructionsHi: string;
  starter?: string; options?: string[]; answer?: string; hints: string[]; prerequisites: string[];
};
export type Evaluation = {
  passed: boolean; feedback: string; feedbackHi?: string; checks: { name: string; passed: boolean; detail?: string }[];
  evidenceType: 'tested' | 'assessed' | 'submitted'; requiresAI?: boolean;
};
export type CodeCase = { args: unknown[]; expected: unknown };

export const missions: Mission[] = [
  {
    id: 'first-function', title: 'Your first working function', titleHi: 'आपका पहला काम करने वाला फ़ंक्शन', skill: 'JavaScript', type: 'coding', minutes: 5, xp: 90, difficulty: 'Beginner',
    objective: 'Turn minutes into a readable learning streak.', objectiveHi: 'मिनटों को पढ़ने योग्य सीखने के संदेश में बदलें।',
    instructions: 'Implement formatMinutes(minutes). Return "1 minute" for 1 and "N minutes" for every other non-negative integer, including zero. Run the browser tests before submitting.',
    instructionsHi: 'formatMinutes(minutes) लिखें। 1 के लिए "1 minute" और अन्य हर शून्य या धनात्मक पूर्णांक के लिए "N minutes" लौटाएँ। जमा करने से पहले परीक्षण चलाएँ।',
    starter: 'function formatMinutes(minutes) {\n  // Return the correct singular or plural label.\n  return "";\n}', hints: ['Use a conditional to handle the singular case.', 'Template literals can combine a number and a label.', 'Compare minutes === 1; zero uses the plural label.'], prerequisites: [],
  },
  {
    id: 'fix-cart', title: 'The disappearing cart total', titleHi: 'गायब होता कार्ट का कुल मूल्य', skill: 'JavaScript', type: 'debugging', minutes: 8, xp: 120, difficulty: 'Beginner',
    objective: 'Find and repair a reducer that forgets earlier items.', objectiveHi: 'पिछली वस्तुओं का मूल्य भूलने वाले reducer को ठीक करें।',
    instructions: 'totalPrice(items) receives an array of {price, quantity}. The broken implementation only remembers the last line item. Repair it without changing the input. An empty cart must cost 0.',
    instructionsHi: 'totalPrice(items) को {price, quantity} की सूची मिलती है। यह अभी केवल अंतिम वस्तु गिनता है। इनपुट बदले बिना ठीक करें। खाली कार्ट का मूल्य 0 होना चाहिए।',
    starter: 'function totalPrice(items) {\n  return items.reduce((total, item) => item.price * item.quantity, 0);\n}', hints: ['What does total contain on the second iteration?', 'The reducer must include both the running total and the current line cost.', 'Return total + item.price * item.quantity.'], prerequisites: ['first-function'],
  },
  {
    id: 'query-learners', title: 'Find the learning leaders', titleHi: 'सीखने में आगे रहने वालों को खोजें', skill: 'SQL', type: 'sql', minutes: 10, xp: 140, difficulty: 'Beginner',
    objective: 'Filter and sort actual rows from a practice table.', objectiveHi: 'अभ्यास की तालिका में पंक्तियाँ छाँटें और क्रमबद्ध करें।',
    instructions: 'Practice SQL subset, not a full database: SELECT columns FROM learners [WHERE one comparison] [ORDER BY column ASC|DESC] [LIMIT n]. Columns: id, name, skill, minutes, xp. Rows: (1,Asha,JavaScript,20,160), (2,Noor,SQL,15,120), (3,Kabir,JavaScript,10,80), (4,Meera,Python,30,240), (5,Ishan,SQL,25,200). Return only name and xp for learners with xp >= 150, highest xp first. No JOINs, aggregation, writes, or arbitrary SQL are supported.',
    instructionsHi: 'यह सीमित अभ्यास SQL है, पूर्ण डेटाबेस नहीं। learners में id, name, skill, minutes, xp स्तंभ हैं। xp >= 150 वाले छात्रों के केवल name और xp लौटाएँ, सबसे अधिक xp पहले। JOIN, aggregation और डेटा बदलने वाले आदेश समर्थित नहीं हैं।',
    starter: 'SELECT name, xp\nFROM learners\nWHERE xp >= 0\nORDER BY xp ASC;', hints: ['WHERE removes rows that do not match the condition.', 'Select name and xp, then compare xp to 150.', 'ORDER BY xp DESC places the largest value first.'], prerequisites: [],
  },
  {
    id: 'sliding-window', title: 'One window, many possibilities', titleHi: 'एक विंडो, कई संभावनाएँ', skill: 'Algorithms', type: 'algorithm', minutes: 12, xp: 180, difficulty: 'Intermediate',
    objective: 'Find the largest sum of exactly k adjacent numbers.', objectiveHi: 'लगातार k संख्याओं का सबसे बड़ा योग खोजें।',
    instructions: 'Implement maxWindowSum(numbers, k). For valid k, return the largest sum of any contiguous window of exactly k numbers. Return null when k < 1 or k exceeds the array length. Negative numbers are valid. The tests check results; they do not prove O(n) complexity.',
    instructionsHi: 'maxWindowSum(numbers, k) में लगातार k संख्याओं का अधिकतम योग लौटाएँ। k < 1 या सूची की लंबाई से अधिक हो तो null लौटाएँ। ऋणात्मक संख्याएँ भी मान्य हैं। परीक्षण परिणाम जाँचते हैं, O(n) समय की गारंटी नहीं देते।',
    starter: 'function maxWindowSum(numbers, k) {\n  // Track a fixed-size window.\n  return null;\n}', hints: ['Check invalid window sizes before calculating.', 'Start with the sum of the first k elements.', 'Move one place: subtract the value leaving the window and add the value entering it.'], prerequisites: ['first-function'],
  },
  {
    id: 'review-boundary', title: 'Review the invisible edge case', titleHi: 'छिपे हुए किनारे के मामले की समीक्षा', skill: 'Engineering', type: 'review', minutes: 6, xp: 80, difficulty: 'Beginner',
    objective: 'Choose a review comment that identifies the actual defect.', objectiveHi: 'वास्तविक गलती पहचानने वाली समीक्षा चुनें।',
    instructions: 'Review: function average(values) { return values.reduce((a, b) => a + b, 0) / values.length; }. The API promises a finite number for every array, including an empty array. Which comment points to a contract violation?',
    instructionsHi: 'average(values) योग को values.length से भाग देता है। API खाली सूची सहित हर सूची के लिए सीमित संख्या का वादा करता है। कौन-सी समीक्षा वास्तविक गलती बताती है?',
    options: ['Rename values to data; the arithmetic is already correct.', 'An empty array divides 0 by 0 and returns NaN; define and test the empty-input result.', 'Replace reduce with map to make the function asynchronous.'],
    answer: 'An empty array divides 0 by 0 and returns NaN; define and test the empty-input result.', hints: ['Try an empty array mentally.', 'What is values.length for []?', 'JavaScript evaluates 0 / 0 as NaN.'], prerequisites: [],
  },
  {
    id: 'ship-change', title: 'Ship a focused change', titleHi: 'एक केंद्रित बदलाव कमिट करें', skill: 'Git & workflows', type: 'git', minutes: 10, xp: 160, difficulty: 'Beginner',
    objective: 'Create a branch, stage a real simulated file change, and commit it.', objectiveHi: 'ब्रांच बनाएँ, फ़ाइल का बदलाव stage करें और commit करें।',
    instructions: 'This is a deterministic Git practice repository, not your local filesystem. Starting on main, create feature/learning-log; replace README.md with exactly "PathForge learning log: first mission completed."; stage and commit it with a meaningful message. main must stay on its initial commit. Supported: git status, git diff, git log, git branch, git switch [-c] BRANCH, git add PATH|., git restore --staged PATH, git commit -m "message". The practice-only command edit PATH "contents" changes a file. Each command goes on its own line.',
    instructionsHi: 'यह अभ्यास के लिए Git repository है, आपकी असली फ़ाइलें नहीं। main से feature/learning-log बनाएँ। README.md में ठीक "PathForge learning log: first mission completed." लिखें। बदलाव stage करके अर्थपूर्ण संदेश से commit करें। main के शुरुआती commit को न बदलें। edit PATH "contents" केवल अभ्यास का संपादन आदेश है।',
    starter: 'git status\n# Create your feature branch, edit the file, stage it, and commit.\n# Use the practice edit command described above.\ngit status', hints: ['A branch points at a commit; creating one does not change main.', 'git add copies the current file contents into the index.', 'A commit snapshots the index, not every working-tree edit.'], prerequisites: [],
  },
  {
    id: 'incident-spike', title: 'The 9:41 latency spike', titleHi: '9:41 पर बढ़ी latency', skill: 'Engineering', type: 'incident', minutes: 8, xp: 100, difficulty: 'Intermediate',
    objective: 'Use the timeline to choose a safe first mitigation.', objectiveHi: 'समयरेखा के आधार पर सुरक्षित पहला कदम चुनें।',
    instructions: 'Simulated incident: 09:38 deploy v42; 09:41 p95 latency rises 180ms → 4200ms and error rate reaches 12%; database CPU remains 25%; v42 adds an unbounded synchronous third-party request. v41 is known healthy and rollback is available. Which action first reduces harm while preserving evidence?',
    instructionsHi: 'अभ्यास घटना: v42 deploy के बाद latency और त्रुटियाँ बढ़ीं। डेटाबेस CPU सामान्य है। v42 में बिना timeout की बाहरी request जुड़ी है। v41 स्वस्थ है और rollback उपलब्ध है। सबसे पहले क्या करेंगे?',
    options: ['Delete the request logs so the dashboard recovers.', 'Roll back to v41, monitor latency and errors, and preserve logs for diagnosis.', 'Increase the database size immediately despite normal database metrics.'],
    answer: 'Roll back to v41, monitor latency and errors, and preserve logs for diagnosis.', hints: ['Correlate the failure with the most recent change.', 'A known healthy rollback is reversible and addresses the likely trigger.', 'Mitigate impact, then investigate with preserved evidence.'], prerequisites: ['review-boundary'],
  },
  {
    id: 'docs-to-fetch', title: 'From API contract to working plan', titleHi: 'API दस्तावेज़ से काम की योजना', skill: 'Engineering', type: 'documentation', minutes: 12, xp: 140, difficulty: 'Intermediate',
    objective: 'Turn a supplied contract into an implementation and test plan.', objectiveHi: 'दिए गए contract से implementation और test plan बनाएँ।',
    instructions: 'Supplied practice contract: GET /v1/lessons returns 200 {items:[{id:string,title:string}],nextCursor:string|null}. Request the next page with ?cursor=VALUE. 429 returns Retry-After in seconds. Explain a pagination algorithm, termination condition, cancellation behavior, and two boundary tests. This exercise uses the supplied contract; it does not retrieve external documentation. Submit your plan for AI rubric review.',
    instructionsHi: 'अभ्यास contract: GET /v1/lessons से items और nextCursor मिलता है। अगले पृष्ठ के लिए ?cursor=VALUE दें। 429 पर Retry-After सेकंड में है। pagination, रुकने की शर्त, cancellation और दो boundary tests लिखें। योजना AI समीक्षा के लिए जमा होगी।',
    starter: 'Algorithm:\n\nTermination and cancellation:\n\nBoundary tests:\n', hints: ['nextCursor === null signals completion.', 'Encode the cursor, and do not discard pages already retrieved.', 'Consider an empty page and rate limiting; cancellation should stop further requests.'], prerequisites: ['review-boundary'],
  },
  {
    id: 'teach-closure', title: 'Teach a curious AI student', titleHi: 'जिज्ञासु AI छात्र को सिखाएँ', skill: 'JavaScript', type: 'teach-back', minutes: 10, xp: 100, difficulty: 'Intermediate',
    objective: 'Explain closures with a prediction and a working example.', objectiveHi: 'उदाहरण और परिणाम के साथ closure समझाएँ।',
    instructions: 'An AI student asks: "Why can a returned function still use a variable after the outer function has finished?" Explain lexical scope, show a small counter example, predict two calls, and correct the misconception that each call always creates a new outer variable. Submit for AI review; a long answer alone is not proof of mastery.',
    instructionsHi: 'AI छात्र पूछता है: बाहरी फ़ंक्शन समाप्त होने के बाद लौटाया गया फ़ंक्शन उसके variable को कैसे उपयोग करता है? lexical scope समझाएँ, counter का उदाहरण दें, दो calls का परिणाम बताएँ और गलत धारणा सुधारें। उत्तर AI समीक्षा के लिए जमा होगा।',
    starter: 'My explanation:\n\nExample:\n\nPrediction for two calls:\n\nMisconception to correct:\n', hints: ['The returned function retains access to its lexical environment.', 'Different calls to the factory create different environments.', 'Within one returned counter, calls share the same captured variable.'], prerequisites: ['first-function'],
  },
  {
    id: 'story-release', title: 'A release before the storm', titleHi: 'मुश्किल से पहले की रिलीज़', skill: 'Engineering', type: 'story', minutes: 5, xp: 70, difficulty: 'Beginner',
    objective: 'Make an evidence-based decision in a release story.', objectiveHi: 'रिलीज़ की कहानी में प्रमाण के आधार पर निर्णय लें।',
    instructions: 'You are the engineer on a small launch team. A product lead asks you to skip the failing checkout tests to meet a deadline. The failure is reproducible and affects real purchases. Choose your next action. This checks one decision; it does not establish broader professional competence.',
    instructionsHi: 'लॉन्च से पहले checkout के परीक्षण बार-बार विफल हो रहे हैं और खरीदारी प्रभावित है। समयसीमा के लिए उन्हें छोड़ने को कहा गया है। अगला कदम चुनें। यह केवल एक निर्णय का आकलन है।',
    options: ['Silently remove the failing tests.', 'Explain the customer impact, reproduce the failure, and propose a fix or a scoped delay with the team.', 'Ship immediately and hope monitoring catches the issue.'],
    answer: 'Explain the customer impact, reproduce the failure, and propose a fix or a scoped delay with the team.', hints: ['A deadline does not change the evidence.', 'Bring a concrete failure and an achievable option to the discussion.', 'Make the risk visible and work toward a shared decision.'], prerequisites: [],
  },
  {
    id: 'real-accessibility', title: 'Audit something you actually use', titleHi: 'अपने उपयोग की चीज़ की accessibility जाँचें', skill: 'Engineering', type: 'real-world', minutes: 15, xp: 150, difficulty: 'Beginner',
    objective: 'Collect evidence from a real keyboard accessibility check.', objectiveHi: 'वास्तविक keyboard accessibility जाँच के प्रमाण जुटाएँ।',
    instructions: 'Choose a website you may inspect. Use only your keyboard to reach its primary action. Record the URL, exact keys, observed focus behavior, one reproducible issue or successful check, and a practical recommendation. Never claim you tested what you did not observe. Your report is submitted evidence awaiting review, not automatically verified accessibility mastery.',
    instructionsHi: 'किसी वेबसाइट के मुख्य action तक केवल keyboard से पहुँचें। URL, दबाई गई keys, focus का व्यवहार, दोहराने योग्य परिणाम और सुझाव लिखें। केवल वही दावा करें जो आपने देखा है। रिपोर्ट समीक्षा के लिए जमा होगी।',
    starter: 'URL:\nKeys and steps:\nObserved behavior:\nEvidence and recommendation:\n', hints: ['Try Tab, Shift+Tab, Enter, and Escape.', 'Watch whether focus remains visible and follows a useful order.', 'Describe a specific observation, rather than a general accessibility claim.'], prerequisites: [],
  },
  {
    id: 'relay-review', title: 'Pass the learning baton', titleHi: 'सीखने की बागडोर आगे बढ़ाएँ', skill: 'Communication', type: 'collaborative', minutes: 15, xp: 160, difficulty: 'Intermediate',
    objective: 'Use a named reviewer’s feedback to improve an artifact.', objectiveHi: 'समीक्षक के सुझाव से अपने काम में सुधार करें।',
    instructions: 'Share a small code snippet or plan with a peer you invite, or explicitly use an AI partner. Paste the original artifact, reviewer name or "AI partner", their concrete feedback, and your revised artifact. State which suggestion you accepted and why. The app does not invent a human participant. Submissions await rubric review.',
    instructionsHi: 'अपना छोटा code या plan किसी आमंत्रित साथी या स्पष्ट रूप से AI साथी को दें। मूल काम, समीक्षक का नाम, वास्तविक सुझाव और सुधरा हुआ काम जमा करें। कौन-सा सुझाव अपनाया और क्यों, यह बताएँ।',
    starter: 'Original artifact:\nReviewer (person or AI):\nFeedback received:\nRevised artifact:\nAccepted suggestion and reason:\n', hints: ['Keep the artifact small enough for a focused review.', 'Ask about one concrete concern rather than requesting generic feedback.', 'Show the change so the reviewer can compare before and after.'], prerequisites: ['review-boundary'],
  },
  {
    id: 'revision-scope', title: 'Recall before you reread', titleHi: 'दोबारा पढ़ने से पहले याद करें', skill: 'JavaScript', type: 'revision', minutes: 2, xp: 50, difficulty: 'Beginner',
    objective: 'Retrieve how block scope behaves without running the code.', objectiveHi: 'बिना code चलाए block scope याद करें।',
    instructions: 'Predict the result: let score = 1; { let score = 2; } console.log(score);. Choose the output. Then use your next coding mission to demonstrate application; this one-item retrieval check provides limited evidence.',
    instructionsHi: 'परिणाम बताएँ: let score = 1; { let score = 2; } console.log(score);। यह केवल एक स्मरण अभ्यास है; अगली coding mission में इसका उपयोग दिखाएँ।',
    options: ['1', '2', 'ReferenceError'], answer: '1', hints: ['let creates a binding in the nearest block.', 'The inner score is separate from the outer score.', 'The outer binding has not been assigned a new value.'], prerequisites: ['first-function'],
  },
  {
    id: 'lab-cache', title: 'Run the tiny cache experiment', titleHi: 'छोटा cache प्रयोग करें', skill: 'Algorithms', type: 'experiment', minutes: 8, xp: 120, difficulty: 'Beginner',
    objective: 'Measure hits, misses, and final state for a small LRU cache.', objectiveHi: 'छोटे LRU cache में hits, misses और अंतिम स्थिति मापें।',
    instructions: 'Paper simulation with exact rules: an initially empty LRU cache holds 2 keys; access makes a key most recently used; a miss inserts it, evicting the least recently used key only if full. Process A, B, A, C, B. Submit JSON with hits, misses, and cache in oldest-to-newest order, for example {"hits":0,"misses":0,"cache":[]}. The check recomputes this fixed trace, not a real server performance benchmark.',
    instructionsHi: 'खाली LRU cache में 2 keys आ सकती हैं। हर access key को सबसे हाल की बनाता है। A, B, A, C, B क्रम चलाएँ। hits, misses और सबसे पुरानी से नई key तक cache का JSON जमा करें। यह निश्चित trace का अभ्यास है, असली server benchmark नहीं।',
    starter: '{\n  "hits": 0,\n  "misses": 0,\n  "cache": []\n}', hints: ['A repeat access is a hit only if the key is still cached.', 'After A, B, A the oldest-to-newest order is B, A.', 'Before inserting C, evict the least recently used key.'], prerequisites: [],
  },
  {
    id: 'state-search', title: 'Move the binary-search boundary', titleHi: 'Binary search की सीमा बदलें', skill: 'Algorithms', type: 'simulation', minutes: 8, xp: 110, difficulty: 'Beginner',
    objective: 'Make one valid transition in a binary-search state machine.', objectiveHi: 'Binary search की स्थिति में एक सही बदलाव करें।',
    instructions: 'Interactive state reasoning: sorted array [2,5,8,12,16,23,38], target 5, inclusive low=0 and high=6. mid=floor((low+high)/2)=3, value=12. Choose the next [low,high] while preserving the target if present.',
    instructionsHi: 'क्रमबद्ध सूची [2,5,8,12,16,23,38] में 5 खोजें। low=0, high=6 और mid=3 पर 12 है। अगली [low,high] सीमा चुनें, ताकि लक्ष्य न खोएँ।',
    options: ['[0, 2]', '[4, 6]', '[0, 3]'], answer: '[0, 2]', hints: ['The target is smaller than the middle value.', 'The middle index cannot be the answer on this step.', 'Keep low and move high to mid - 1.'], prerequisites: [],
  },
  {
    id: 'build-focus', title: 'Build a useful focus timer', titleHi: 'उपयोगी focus timer बनाएँ', skill: 'JavaScript', type: 'project', minutes: 25, xp: 240, difficulty: 'Intermediate',
    objective: 'Build the tested state engine of a usable focus timer.', objectiveHi: 'उपयोगी focus timer का परीक्षण योग्य state engine बनाएँ।',
    instructions: 'Implement updateTimer(state, action) without mutating state. State is {total,remaining,running}, measured in seconds. start sets running=true only if remaining>0; pause sets running=false; reset restores remaining=total and pauses; tick decreases remaining by 1 only while running and stops at zero. Unknown actions return an unchanged state. Return a fresh or unchanged object with exactly those three fields. These tests validate timer state transitions, not browser timing accuracy or UI accessibility.',
    instructionsHi: 'state बदले बिना updateTimer(state, action) लिखें। state में सेकंड में total, remaining और running हैं। start केवल remaining>0 पर शुरू करे; pause रोके; reset पर remaining=total और running=false हो; tick केवल चलते timer का 1 सेकंड घटाए और zero पर रोक दे। अज्ञात action पर स्थिति वही रहे। परीक्षण state transitions जाँचते हैं, वास्तविक clock या UI की accuracy नहीं।',
    starter: 'function updateTimer(state, action) {\n  // Return { total, remaining, running } without changing state.\n  return { ...state };\n}', hints: ['Separate the timer’s state transitions from browser scheduling.', 'Use an action switch and return a new object when changing a field.', 'A tick that reaches zero must also set running to false.'], prerequisites: ['fix-cart'],
  },
  {
    id: 'roleplay-standup', title: 'A standup with a real blocker', titleHi: 'असली बाधा के साथ standup', skill: 'Communication', type: 'roleplay', minutes: 8, xp: 100, difficulty: 'Beginner',
    objective: 'Give a concise update that helps the team act.', objectiveHi: 'टीम की मदद करने वाला संक्षिप्त status दें।',
    instructions: 'Roleplay: you own the lesson-search feature. Yesterday the local search passed tests; today integration is blocked because the staging API returns 401. Write a short standup update with completed work, next action, the blocker, and a precise request to the API owner. The AI reviewer plays your team lead and assesses clarity, rather than pretending a human colleague replied.',
    instructionsHi: 'आप lesson-search feature बना रहे हैं। कल local search के tests पास हुए; आज staging API का 401 integration रोक रहा है। पूरा काम, अगला कदम, बाधा और API owner से स्पष्ट मदद का अनुरोध लिखें। AI team lead की भूमिका में समीक्षा करेगा।',
    starter: 'Completed:\nNext:\nBlocked by:\nRequest:\n', hints: ['Name the blocked task, not only the status code.', 'Ask a specific person or role for a concrete action.', 'Keep the update short enough to use in a standup.'], prerequisites: [],
  },
];

export const codeChallenges: Record<string, { functionName: string; cases: CodeCase[] }> = {
  'first-function': { functionName: 'formatMinutes', cases: [{ args: [1], expected: '1 minute' }, { args: [0], expected: '0 minutes' }, { args: [25], expected: '25 minutes' }, { args: [120], expected: '120 minutes' }] },
  'fix-cart': { functionName: 'totalPrice', cases: [{ args: [[]], expected: 0 }, { args: [[{ price: 10, quantity: 2 }, { price: 5, quantity: 3 }]], expected: 35 }, { args: [[{ price: 0, quantity: 9 }, { price: 7, quantity: 0 }]], expected: 0 }, { args: [[{ price: 2.5, quantity: 2 }, { price: 1.25, quantity: 4 }]], expected: 10 }] },
  'sliding-window': { functionName: 'maxWindowSum', cases: [{ args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 }, { args: [[-4, -2, -7], 2], expected: -6 }, { args: [[5], 1], expected: 5 }, { args: [[], 1], expected: null }, { args: [[1, 2], 0], expected: null }, { args: [[1, 2], 3], expected: null }, { args: [[4, 2, 1], 3], expected: 7 }] },
  'build-focus': { functionName: 'updateTimer', cases: [
    { args: [{ total: 1500, remaining: 1500, running: false }, 'start'], expected: { total: 1500, remaining: 1500, running: true } },
    { args: [{ total: 1500, remaining: 40, running: true }, 'pause'], expected: { total: 1500, remaining: 40, running: false } },
    { args: [{ total: 1500, remaining: 40, running: false }, 'reset'], expected: { total: 1500, remaining: 1500, running: false } },
    { args: [{ total: 10, remaining: 3, running: true }, 'tick'], expected: { total: 10, remaining: 2, running: true } },
    { args: [{ total: 10, remaining: 1, running: true }, 'tick'], expected: { total: 10, remaining: 0, running: false } },
    { args: [{ total: 10, remaining: 3, running: false }, 'tick'], expected: { total: 10, remaining: 3, running: false } },
    { args: [{ total: 10, remaining: 0, running: false }, 'start'], expected: { total: 10, remaining: 0, running: false } },
    { args: [{ total: 10, remaining: 3, running: false }, 'unknown'], expected: { total: 10, remaining: 3, running: false } },
  ] },
};

export function codeFingerprint(source: string): string {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aa = a as Record<string, unknown>, bb = b as Record<string, unknown>;
  const keys = Object.keys(aa).sort(), otherKeys = Object.keys(bb).sort();
  return keys.length === otherKeys.length && keys.every((key, i) => key === otherKeys[i] && sameValue(aa[key], bb[key]));
}

type SqlValue = string | number;
export const learnersTable: ReadonlyArray<Readonly<Record<string, SqlValue>>> = Object.freeze([
  Object.freeze({ id: 1, name: 'Asha', skill: 'JavaScript', minutes: 20, xp: 160 }),
  Object.freeze({ id: 2, name: 'Noor', skill: 'SQL', minutes: 15, xp: 120 }),
  Object.freeze({ id: 3, name: 'Kabir', skill: 'JavaScript', minutes: 10, xp: 80 }),
  Object.freeze({ id: 4, name: 'Meera', skill: 'Python', minutes: 30, xp: 240 }),
  Object.freeze({ id: 5, name: 'Ishan', skill: 'SQL', minutes: 25, xp: 200 }),
]);
/** Deliberately constrained, read-only teaching interpreter. Never executes submitted SQL. */
export function runConstrainedSql(query: string): { columns: string[]; rows: Record<string, SqlValue>[] } {
  if (typeof query !== 'string' || query.length > 4000) throw new Error('Enter a query of at most 4,000 characters.');
  const pattern = /^\s*SELECT\s+(\*|[a-z_]+(?:\s*,\s*[a-z_]+)*)\s+FROM\s+learners(?:\s+WHERE\s+([a-z_]+)\s*(>=|<=|<>|!=|=|>|<)\s*(-?\d+(?:\.\d+)?|'(?:[^']|'')*'))?(?:\s+ORDER\s+BY\s+([a-z_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?\s*;?\s*$/i;
  const parsed = query.match(pattern);
  if (!parsed) throw new Error('Use the practice SELECT subset: columns FROM learners, one optional WHERE comparison, ORDER BY, and LIMIT.');
  const allColumns = ['id', 'name', 'skill', 'minutes', 'xp'];
  const columns = parsed[1] === '*' ? allColumns : parsed[1].toLowerCase().split(',').map(x => x.trim());
  const whereColumn = parsed[2]?.toLowerCase(), orderColumn = parsed[5]?.toLowerCase();
  for (const column of [...columns, whereColumn, orderColumn].filter(Boolean)) {
    if (!allColumns.includes(column!)) throw new Error(`Unknown column: ${column}.`);
  }
  if (new Set(columns).size !== columns.length) throw new Error('Select each column only once.');
  let rows = learnersTable.map(row => ({ ...row }));
  if (whereColumn) {
    const literal = parsed[4], right: SqlValue = literal.startsWith("'") ? literal.slice(1, -1).replace(/''/g, "'") : Number(literal);
    if (typeof rows[0][whereColumn] !== typeof right) throw new Error('Compare numeric columns to numbers and text columns to single-quoted text.');
    rows = rows.filter(row => {
      const left = row[whereColumn];
      switch (parsed[3]) {
        case '=': return left === right; case '!=': case '<>': return left !== right;
        case '>': return left > right; case '<': return left < right;
        case '>=': return left >= right; case '<=': return left <= right;
        default: return false;
      }
    });
  }
  if (orderColumn) {
    const direction = parsed[6]?.toUpperCase() === 'DESC' ? -1 : 1;
    rows.sort((a, b) => a[orderColumn] === b[orderColumn] ? 0 : (a[orderColumn] < b[orderColumn] ? -1 : 1) * direction);
  }
  if (parsed[7]) {
    const limit = Number(parsed[7]);
    if (limit < 1 || limit > 100) throw new Error('The practice LIMIT range is 1 to 100.');
    rows = rows.slice(0, limit);
  }
  return { columns, rows: rows.map(row => Object.fromEntries(columns.map(key => [key, row[key]]))) };
}

type GitTree = Record<string, string>;
export type GitCommit = { id: string; parent: string | null; message: string; files: GitTree };
export type GitSimulation = { branch: string; branches: Record<string, string>; commits: GitCommit[]; files: GitTree; staged: string[]; modified: string[]; untracked: string[]; log: string[]; errors: string[] };
const initialReadme = '# PathForge\nLearn by doing.\n';
const requiredReadme = 'PathForge learning log: first mission completed.';

function tokenizeCommand(command: string): string[] {
  const parts: string[] = [];
  let value = '', quote = '', tokenStarted = false;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (c === '\\' && quote === '"') {
      const next = command[++i];
      if (!next) throw new Error('Incomplete escape sequence.');
      value += next === 'n' ? '\n' : next === 't' ? '\t' : next; tokenStarted = true;
    } else if (quote) {
      if (c === quote) quote = ''; else value += c;
    } else if (c === '"' || c === "'") { quote = c; tokenStarted = true; }
    else if (/\s/.test(c)) { if (tokenStarted) { parts.push(value); value = ''; tokenStarted = false; } }
    else { value += c; tokenStarted = true; }
  }
  if (quote) throw new Error('Close the quoted argument.');
  if (tokenStarted) parts.push(value);
  return parts;
}

/** A small in-memory Git model: actual snapshots, index, branch refs, and safe switching. */
export function simulateGit(input: string | string[]): GitSimulation {
  const commands = Array.isArray(input) ? input : input.split(/\r?\n/);
  const branches: Record<string, string> = { main: 'c0' };
  const commits: GitCommit[] = [{ id: 'c0', parent: null, message: 'Initial commit', files: { 'README.md': initialReadme } }];
  const files: GitTree = { 'README.md': initialReadme };
  let branch = 'main', index: GitTree = { ...files };
  const log: string[] = [], errors: string[] = [];
  const head = () => commits.find(c => c.id === branches[branch])!;
  const changedPaths = (a: GitTree, b: GitTree) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(p => a[p] !== b[p]);
  if (commands.length > 80 || commands.join('\n').length > 12000) return { branch, branches, commits, files, staged: [], modified: [], untracked: [], log, errors: ['Use at most 80 commands and 12,000 characters.'] };
  for (let line = 0; line < commands.length; line++) {
    const command = commands[line].trim();
    if (!command || command.startsWith('#')) continue;
    try {
      const args = tokenizeCommand(command);
      if (args[0] === 'edit') {
        if (args.length !== 3 || !['README.md', 'notes.md'].includes(args[1])) throw new Error('Practice edit syntax: edit README.md|notes.md "contents".');
        files[args[1]] = args[2]; log.push(`Edited ${args[1]} in the working tree.`); continue;
      }
      if (args[0] !== 'git') throw new Error('Only supported git commands and the practice edit command can run.');
      if (args[1] === 'status' && args.length === 2) {
        log.push(`On ${branch}; staged: ${changedPaths(head().files, index).join(', ') || 'none'}; modified: ${changedPaths(index, files).filter(p => p in index).join(', ') || 'none'}; untracked: ${Object.keys(files).filter(p => !(p in index)).join(', ') || 'none'}.`);
      } else if (args[1] === 'diff' && args.length === 2) {
        log.push(changedPaths(index, files).filter(p => p in index).map(p => `${p}: ${JSON.stringify(index[p])} → ${JSON.stringify(files[p])}`).join('\n') || 'No unstaged tracked changes.');
      } else if (args[1] === 'log' && args.length === 2) {
        let commit: GitCommit | undefined = head(); const history: string[] = [];
        while (commit) { history.push(`${commit.id} ${commit.message}`); commit = commits.find(c => c.id === commit!.parent); }
        log.push(history.join('\n'));
      } else if (args[1] === 'branch' && args.length === 2) {
        log.push(Object.keys(branches).map(b => `${b === branch ? '* ' : '  '}${b}`).join('\n'));
      } else if (args[1] === 'switch') {
        const create = args[2] === '-c', target = args[create ? 3 : 2];
        if (args.length !== (create ? 4 : 3) || !target || !/^[a-z][a-z0-9/_-]*$/i.test(target) || target.endsWith('/') || target.includes('//') || target.endsWith('.lock')) throw new Error('Use git switch BRANCH or git switch -c BRANCH (simple branch names only).');
        if (create) {
          if (Object.hasOwn(branches, target)) throw new Error(`Branch ${target} already exists.`);
          branches[target] = branches[branch]; branch = target; log.push(`Created and switched to ${target}.`);
        } else {
          if (!Object.hasOwn(branches, target)) throw new Error(`Branch ${target} does not exist.`);
          const current = head().files, targetTree = commits.find(c => c.id === branches[target])!.files;
          const updating = changedPaths(current, targetTree);
          const conflict = updating.find(p => (index[p] !== current[p] || files[p] !== index[p]) && (index[p] !== targetTree[p] || files[p] !== targetTree[p]));
          if (conflict) throw new Error(`Switch would overwrite changes to ${conflict}; commit or restore them first.`);
          for (const p of updating) {
            if (Object.hasOwn(targetTree, p)) { files[p] = targetTree[p]; index[p] = targetTree[p]; }
            else { delete files[p]; delete index[p]; }
          }
          branch = target; log.push(`Switched to ${target}.`);
        }
      } else if (args[1] === 'add' && args.length === 3) {
        if (args[2] === '.') index = { ...files };
        else {
          if (!Object.hasOwn(files, args[2])) throw new Error(`Path ${args[2]} does not exist.`);
          index[args[2]] = files[args[2]];
        }
        log.push(`Staged ${args[2]}.`);
      } else if (args[1] === 'restore' && args[2] === '--staged' && args.length === 4) {
        const p = args[3];
        if (!Object.hasOwn(index, p) && !Object.hasOwn(head().files, p)) throw new Error(`Path ${p} is not staged or tracked.`);
        if (Object.hasOwn(head().files, p)) index[p] = head().files[p]; else delete index[p];
        log.push(`Unstaged ${p}; working file preserved.`);
      } else if (args[1] === 'commit' && args[2] === '-m' && args.length === 4) {
        if (!args[3].trim()) throw new Error('The commit message must not be empty.');
        if (!changedPaths(head().files, index).length) throw new Error('Nothing staged to commit. Use git add after editing.');
        const commit: GitCommit = { id: `c${commits.length}`, parent: head().id, message: args[3], files: { ...index } };
        commits.push(commit); branches[branch] = commit.id; log.push(`[${branch} ${commit.id}] ${commit.message}`);
      } else throw new Error('Unsupported command. See this mission’s supported Git subset.');
    } catch (error) { errors.push(`Line ${line + 1}: ${error instanceof Error ? error.message : 'Command failed.'}`); }
  }
  return { branch, branches, commits, files: { ...files }, staged: changedPaths(head().files, index), modified: changedPaths(index, files).filter(p => p in index), untracked: Object.keys(files).filter(p => !(p in index)), log, errors };
}

export function simulateLru(requests: string[], capacity: number) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100 || requests.length > 1000) throw new Error('Use capacity 1–100 and at most 1,000 requests.');
  const cache: string[] = []; let hits = 0, misses = 0;
  const trace = requests.map(key => {
    const index = cache.indexOf(key), hit = index !== -1;
    if (hit) { hits++; cache.splice(index, 1); } else { misses++; if (cache.length === capacity) cache.shift(); }
    cache.push(key); return { key, hit, cache: [...cache] };
  });
  return { hits, misses, cache: [...cache], trace };
}

type Submission = Record<string, unknown>;
function submissionObject(value: unknown): Submission { return value && typeof value === 'object' && !Array.isArray(value) ? value as Submission : { text: typeof value === 'string' ? value : '' }; }
function submissionText(value: Submission): string { return String(value.text ?? value.query ?? value.commands ?? value.code ?? '').trim(); }
const incomplete = (feedback: string): Evaluation => ({ passed: false, feedback, checks: [{ name: 'Usable evidence received', passed: false }], evidenceType: 'submitted' });

/** Pure evaluation: no submitted source, URL, SQL, or shell command is executed on the server. */
function evaluateMissionResult(missionId: string, submission: unknown): Evaluation {
  const mission = missions.find(m => m.id === missionId);
  if (!mission) return incomplete('This mission does not exist. Choose a mission from your learning path.');
  const data = submissionObject(submission), text = submissionText(data);
  if (codeChallenges[missionId]) {
    const code = typeof data.code === 'string' ? data.code : '';
    const testResults = data.testResults as { sourceHash?: string; error?: string; cases?: { passed?: boolean; actual?: unknown; error?: string }[] } | undefined;
    if (!code.trim() || !testResults) return incomplete('Run your code in the isolated browser test runner, then submit its results with the source.');
    if (testResults.sourceHash !== codeFingerprint(code)) return incomplete('The code changed after these results were produced. Run the tests again for the current source.');
    const expected = codeChallenges[missionId].cases;
    const checks = expected.map((test, i) => ({ name: `Case ${i + 1}: ${JSON.stringify(test.args)}`, passed: !testResults.error && testResults.cases?.[i]?.passed === true && !testResults.cases[i].error && sameValue(testResults.cases[i].actual, test.expected), detail: testResults.cases?.[i]?.error || `Expected ${JSON.stringify(test.expected)}; received ${JSON.stringify(testResults.cases?.[i]?.actual) ?? 'no result'}.` }));
    const countMatches = testResults.cases?.length === expected.length;
    if (!countMatches || testResults.error) checks.push({ name: 'Runner completed all fixed cases', passed: false, detail: testResults.error || 'The result count does not match this exercise.' });
    const passed = countMatches && checks.every(c => c.passed);
    return { passed, checks, evidenceType: 'tested', feedback: passed ? `All ${expected.length} fixed browser tests passed. This is evidence for this exercise; performance and broader mastery require additional work.` : 'Some fixed tests did not pass. Compare the actual results with the expected values, then try again.' };
  }
  if (mission.type === 'sql') {
    try {
      const result = runConstrainedSql(String(data.query ?? text));
      const checks = [
        { name: 'Returns only name and xp', passed: sameValue([...result.columns].sort(), ['name', 'xp']) },
        { name: 'Filters and orders the expected rows', passed: sameValue(result.rows, [{ name: 'Meera', xp: 240 }, { name: 'Ishan', xp: 200 }, { name: 'Asha', xp: 160 }]) },
      ];
      return { passed: checks.every(c => c.passed), checks, evidenceType: 'tested', feedback: checks.every(c => c.passed) ? 'The practice SELECT returned the correct columns, rows, and order.' : 'The query ran in the practice subset. Check the selected columns, threshold, and descending order.' };
    } catch (error) { return { passed: false, checks: [{ name: 'Valid practice SELECT', passed: false, detail: error instanceof Error ? error.message : 'Invalid query.' }], evidenceType: 'tested', feedback: error instanceof Error ? error.message : 'Invalid query.' }; }
  }
  if (mission.type === 'git') {
    const result = simulateGit(String(data.commands ?? text));
    const featureCommit = result.commits.find(c => c.id === result.branches['feature/learning-log']);
    const checks = [
      { name: 'Supported commands completed without errors', passed: result.errors.length === 0, detail: result.errors.join(' ') || 'No command errors.' },
      { name: 'Created feature/learning-log and committed a change', passed: Boolean(featureCommit && featureCommit.id !== 'c0' && featureCommit.parent === 'c0') },
      { name: 'Commit contains the required README artifact', passed: featureCommit?.files['README.md'] === requiredReadme },
      { name: 'main still points to the initial commit', passed: result.branches.main === 'c0' },
      { name: 'Working tree and index are clean', passed: !result.staged.length && !result.modified.length && !result.untracked.length },
    ];
    const passed = checks.every(c => c.passed);
    return { passed, checks, evidenceType: 'tested', feedback: passed ? 'The simulated repository contains the intended feature commit, with main preserved and no pending changes.' : 'The repository state does not yet meet the goal. Inspect the simulator output and remember that a commit snapshots staged contents.' };
  }
  if (mission.type === 'experiment') {
    let result: Submission;
    try { result = 'hits' in data ? data : submissionObject(JSON.parse(text)); } catch { return incomplete('Submit valid JSON containing hits, misses, and cache.'); }
    const expected = simulateLru(['A', 'B', 'A', 'C', 'B'], 2);
    const checks = [
      { name: 'Correct hit count', passed: result.hits === expected.hits },
      { name: 'Correct miss count', passed: result.misses === expected.misses },
      { name: 'Final cache in oldest-to-newest order', passed: sameValue(result.cache, expected.cache) },
    ];
    const passed = checks.every(c => c.passed);
    return { passed, checks, evidenceType: 'tested', feedback: passed ? 'Your counts and final cache match the deterministic LRU trace.' : 'Trace each request and update recency on both hits and misses. Compare counts and final ordering.' };
  }
  if (mission.options && mission.answer) {
    const choice = typeof submission === 'string' ? submission : String(data.choice ?? data.answer ?? data.text ?? '');
    const valid = mission.options.includes(choice), passed = valid && choice === mission.answer;
    return { passed, checks: [{ name: 'Selected a provided option', passed: valid }, { name: 'Scenario decision is correct', passed }], evidenceType: 'assessed', feedback: passed ? 'Correct for this scenario. This is a focused knowledge check; apply it in a practical mission for stronger evidence.' : valid ? 'That choice does not satisfy the scenario. Use the evidence and try again.' : 'Choose one of the provided options.' };
  }
  const usable = text.length >= 80 && text.length <= 40000;
  return {
    passed: false, evidenceType: 'submitted', requiresAI: usable,
    checks: [{ name: 'Substantive artifact or explanation submitted', passed: usable, detail: usable ? 'Evidence is ready for rubric review. Length alone does not establish correctness.' : 'Provide 80–40,000 characters of actual work and observations.' }, { name: 'Independent rubric review completed', passed: false, detail: 'A connected AI reviewer or human review is required; no keyword score awards mastery.' }],
    feedback: usable ? 'Evidence received and ready for review. This submission has not yet passed a correctness or mastery assessment.' : 'Add your actual artifact, reasoning, or observations before requesting review (at least 80 characters).',
  };
}

export function evaluateMission(missionId: string, submission: unknown): Evaluation {
  const result = evaluateMissionResult(missionId, submission);
  const feedbackHi = result.evidenceType === 'submitted'
    ? result.requiresAI
      ? 'आपका काम प्राप्त हुआ और समीक्षा के लिए तैयार है। अभी इसकी शुद्धता या कौशल की स्वतंत्र पुष्टि नहीं हुई है।'
      : 'जमा करने योग्य प्रमाण अधूरा है। निर्देश देखें और अपना वास्तविक काम या वर्तमान code के परीक्षण परिणाम दें।'
    : result.passed
      ? result.evidenceType === 'tested'
        ? 'इस अभ्यास की सभी निश्चित जाँचें सफल हुईं। यह इसी कार्य का प्रमाण है; व्यापक कौशल के लिए और अभ्यास ज़रूरी है।'
        : 'इस परिस्थिति के लिए सही निर्णय। अधिक मजबूत प्रमाण के लिए इसे व्यावहारिक अभ्यास में लागू करें।'
      : 'अभी सभी जाँचें सफल नहीं हुई हैं। अपेक्षित परिणाम और निर्देश देखें, फिर दोबारा प्रयास करें।';
  return { ...result, feedbackHi };
}

/** A separate bounded check; it never grades the truth or quality of a written artifact. */
export const submissionChecks: Record<string, { question: string; questionHi: string; options: string[]; answer: string }> = {
  'teach-closure': {
    question: 'A factory sets n=0 and returns () => ++n. After const c=factory(), what do c(), c() return?',
    questionHi: 'factory में n=0 है और वह () => ++n लौटाता है। const c=factory() के बाद c(), c() क्या देंगे?',
    options: ['1, then 2: both calls share the captured environment.', '1, then 1: every inner call resets the outer variable.', 'Both calls throw because the factory has returned.'],
    answer: '1, then 2: both calls share the captured environment.',
  },
  'docs-to-fetch': {
    question: 'The supplied contract returns nextCursor=null after a successful page. What should the pagination loop do?',
    questionHi: 'दिए contract में सफल पृष्ठ के बाद nextCursor=null है। pagination loop क्या करे?',
    options: ['Stop requesting pages and keep the items already received.', 'Send cursor=null forever.', 'Discard every page and treat the response as an error.'],
    answer: 'Stop requesting pages and keep the items already received.',
  },
  'real-accessibility': {
    question: 'Which statement is bounded, reproducible evidence from a keyboard audit?',
    questionHi: 'Keyboard audit का कौन-सा कथन सीमित और दोहराने योग्य प्रमाण है?',
    options: ['This website is fully accessible for everyone.', 'On the recorded page, pressing Tab three times reached checkout, but its focus indicator was not visible.', 'The site looks modern, so keyboard testing is unnecessary.'],
    answer: 'On the recorded page, pressing Tab three times reached checkout, but its focus indicator was not visible.',
  },
  'roleplay-standup': {
    question: 'Which request gives the API owner a concrete next action for the staging 401 blocker?',
    questionHi: 'Staging 401 की बाधा में कौन-सा अनुरोध API owner को स्पष्ट अगला कदम देता है?',
    options: ['Please fix everything immediately.', 'Could you confirm the required staging credential scope for GET /lessons so I can retry integration?', 'I will paste our private token into the public standup channel.'],
    answer: 'Could you confirm the required staging credential scope for GET /lessons so I can retry integration?',
  },
};

export function confirmSubmissionCheck(missionId: string, submission: unknown, choice: string): Evaluation {
  const base = evaluateMission(missionId, submission), check = submissionChecks[missionId];
  if (!check || !base.requiresAI || base.evidenceType !== 'submitted') return base;
  const valid = check.options.includes(choice), passed = valid && choice === check.answer;
  return {
    passed, evidenceType: 'assessed', requiresAI: true,
    checks: [
      { name: 'Written evidence submitted', passed: true, detail: 'Stored for review; its quality, authorship, and real-world claims are not independently verified.' },
      { name: 'Bounded knowledge check', passed, detail: valid ? 'Only the selected scenario answer is assessed.' : 'Choose one of the provided answers.' },
    ],
    feedback: passed ? 'The bounded knowledge check passed. Your written artifact remains unreviewed; this records an assessed checkpoint, not verified artifact correctness or broader expertise.' : 'Written evidence remains submitted. That answer did not pass the separate knowledge check; the artifact still awaits review.',
    feedbackHi: passed ? 'सीमित ज्ञान जाँच सफल हुई। लिखित काम की गुणवत्ता अभी जाँची नहीं गई है। यह केवल आकलित checkpoint है, व्यापक कौशल की पुष्टि नहीं।' : 'लिखित काम जमा है। अलग ज्ञान जाँच का उत्तर अभी सही नहीं है और काम की समीक्षा बाकी है।',
  };
}

export type MissionStatus = 'completed' | 'in-progress' | 'available' | 'locked';
export function getMissionStatus(missionId: string, completedIds: string[], startedIds: string[] = []): MissionStatus {
  const mission = missions.find(m => m.id === missionId);
  if (!mission) return 'locked';
  if (completedIds.includes(missionId)) return 'completed';
  if (!mission.prerequisites.every(id => completedIds.includes(id))) return 'locked';
  return startedIds.includes(missionId) ? 'in-progress' : 'available';
}
export function chooseNextMission(completedIds: string[], availableMinutes = 25, preferredSkill?: string, startedIds: string[] = []): Mission | null {
  const candidates = missions.filter(m => ['available', 'in-progress'].includes(getMissionStatus(m.id, completedIds, startedIds)) && m.minutes <= Math.max(0, availableMinutes));
  candidates.sort((a, b) => Number(startedIds.includes(b.id)) - Number(startedIds.includes(a.id)) || Number(b.skill === preferredSkill) - Number(a.skill === preferredSkill) || missions.indexOf(a) - missions.indexOf(b));
  return candidates[0] ?? null;
}
