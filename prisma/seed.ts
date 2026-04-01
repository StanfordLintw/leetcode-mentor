import { PrismaClient, Difficulty, Category } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const problems = [
  // ─── ARRAY ────────────────────────────────────────────────────────────────
  {
    leetcodeId: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: Difficulty.EASY,
    category: Category.ARRAY,
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow.',
      'Try to use a hash map to store the numbers you have seen so far and their indices.',
      'For each number, check if target - number exists in the hash map.',
    ],
    tags: ['Array', 'Hash Table'],
    starterCode: {
      python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass\n',
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};\n',
      typescript: 'function twoSum(nums: number[], target: number): number[] {\n    \n};\n',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};\n',
    },
    solution:
      'Use a hash map to store each number\'s index. For each element, check if (target - element) already exists in the map.\n\n```python\ndef twoSum(self, nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  {
    leetcodeId: 53,
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: Difficulty.MEDIUM,
    category: Category.ARRAY,
    description:
      'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.',
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: [
      "Think about Kadane's algorithm.",
      'At each index, decide: should we extend the current subarray or start a new one?',
      'The current subarray sum is max(nums[i], currentSum + nums[i]).',
    ],
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    starterCode: {
      python: 'class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        pass\n',
      javascript: '/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};\n',
      typescript: 'function maxSubArray(nums: number[]): number {\n    \n};\n',
      java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};\n',
    },
    solution:
      "Kadane's Algorithm: maintain a running sum; reset to current element when the running sum goes negative.\n\n```python\ndef maxSubArray(self, nums):\n    max_sum = current = nums[0]\n    for num in nums[1:]:\n        current = max(num, current + num)\n        max_sum = max(max_sum, current)\n    return max_sum\n```",
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },
  {
    leetcodeId: 56,
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    difficulty: Difficulty.MEDIUM,
    category: Category.ARRAY,
    description:
      'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].',
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.',
      },
    ],
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= starti <= endi <= 10^4'],
    hints: [
      'Sort the intervals by their start times first.',
      'After sorting, iterate and merge consecutive overlapping intervals.',
      'Two intervals overlap if the start of the next interval is <= the end of the current merged interval.',
    ],
    tags: ['Array', 'Sorting'],
    starterCode: {
      python: 'class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        pass\n',
      javascript: '/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n    \n};\n',
      typescript: 'function merge(intervals: number[][]): number[][] {\n    \n};\n',
      java: 'class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};\n',
    },
    solution:
      'Sort by start time, then greedily merge.\n\n```python\ndef merge(self, intervals):\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for start, end in intervals[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged\n```',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
  },

  // ─── STRING ───────────────────────────────────────────────────────────────
  {
    leetcodeId: 3,
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: Difficulty.MEDIUM,
    category: Category.SLIDING_WINDOW,
    description:
      'Given a string `s`, find the length of the longest substring without repeating characters.',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    hints: [
      'Use a sliding window with two pointers.',
      'Maintain a set of characters currently in the window.',
      'When a duplicate is found, shrink the window from the left until the duplicate is removed.',
    ],
    tags: ['Hash Table', 'String', 'Sliding Window'],
    starterCode: {
      python: 'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass\n',
      javascript: '/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};\n',
      typescript: 'function lengthOfLongestSubstring(s: string): number {\n    \n};\n',
      java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};\n',
    },
    solution:
      'Sliding window with a character-to-index map.\n\n```python\ndef lengthOfLongestSubstring(self, s):\n    char_index = {}\n    left = max_len = 0\n    for right, ch in enumerate(s):\n        if ch in char_index and char_index[ch] >= left:\n            left = char_index[ch] + 1\n        char_index[ch] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(m,n)) where m is charset size',
  },
  {
    leetcodeId: 20,
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: Difficulty.EASY,
    category: Category.STACK_QUEUE,
    description:
      "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'A single pair of matching parentheses is valid.',
      },
      {
        input: 's = "([)]"',
        output: 'false',
        explanation: 'The brackets are not closed in the correct order.',
      },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\'.'],
    hints: [
      'Use a stack data structure.',
      'Push opening brackets onto the stack.',
      'When you see a closing bracket, check if the top of the stack is the matching opener.',
    ],
    tags: ['String', 'Stack'],
    starterCode: {
      python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass\n',
      javascript: '/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};\n',
      typescript: 'function isValid(s: string): boolean {\n    \n};\n',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};\n',
    },
    solution:
      'Stack-based matching.\n\n```python\ndef isValid(self, s):\n    stack = []\n    mapping = {\')\': \'(\', \'}\': \'{\', \']\': \'[\'}\n    for ch in s:\n        if ch in mapping:\n            top = stack.pop() if stack else \'#\'\n            if mapping[ch] != top:\n                return False\n        else:\n            stack.append(ch)\n    return not stack\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  {
    leetcodeId: 5,
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindromic-substring',
    difficulty: Difficulty.MEDIUM,
    category: Category.STRING,
    description:
      'Given a string `s`, return the longest palindromic substring in `s`.',
    examples: [
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: '"aba" is also a valid answer.',
      },
      {
        input: 's = "cbbd"',
        output: '"bb"',
        explanation: '"bb" is the longest palindromic substring.',
      },
    ],
    constraints: ['1 <= s.length <= 1000', 's consist of only digits and English letters.'],
    hints: [
      'Try the expand-around-center approach.',
      'For each character (and each pair of adjacent characters), expand outward while the characters match.',
      'Track the longest palindrome found during expansion.',
    ],
    tags: ['String', 'Dynamic Programming'],
    starterCode: {
      python: 'class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        pass\n',
      javascript: '/**\n * @param {string} s\n * @return {string}\n */\nvar longestPalindrome = function(s) {\n    \n};\n',
      typescript: 'function longestPalindrome(s: string): string {\n    \n};\n',
      java: 'class Solution {\n    public String longestPalindrome(String s) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    string longestPalindrome(string s) {\n        \n    }\n};\n',
    },
    solution:
      'Expand around center for both odd and even length palindromes.\n\n```python\ndef longestPalindrome(self, s):\n    def expand(l, r):\n        while l >= 0 and r < len(s) and s[l] == s[r]:\n            l -= 1; r += 1\n        return s[l+1:r]\n    result = ""\n    for i in range(len(s)):\n        odd = expand(i, i)\n        even = expand(i, i+1)\n        result = max(result, odd, even, key=len)\n    return result\n```',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
  },

  // ─── LINKED LIST ──────────────────────────────────────────────────────────
  {
    leetcodeId: 2,
    title: 'Add Two Numbers',
    slug: 'add-two-numbers',
    difficulty: Difficulty.MEDIUM,
    category: Category.LINKED_LIST,
    description:
      'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.',
    examples: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807.',
      },
      {
        input: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]',
        output: '[8,9,9,9,0,0,0,1]',
        explanation: '9999999 + 9999 = 10009998.',
      },
    ],
    constraints: [
      'The number of nodes in each linked list is in the range [1, 100].',
      '0 <= Node.val <= 9',
      'It is guaranteed that the list represents a number that does not have leading zeros.',
    ],
    hints: [
      'Keep track of the carry using a variable and simulate digit-by-digit addition.',
      'Be careful about the case where one list is longer than the other.',
      "Don't forget to add an extra node if there's a carry left after processing both lists.",
    ],
    tags: ['Linked List', 'Math', 'Recursion'],
    starterCode: {
      python: '# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n        pass\n',
      javascript: '/**\n * @param {ListNode} l1\n * @param {ListNode} l2\n * @return {ListNode}\n */\nvar addTwoNumbers = function(l1, l2) {\n    \n};\n',
      typescript: 'function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {\n    \n};\n',
      java: 'class Solution {\n    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n        \n    }\n};\n',
    },
    solution:
      'Simulate addition with a dummy head and carry.\n\n```python\ndef addTwoNumbers(self, l1, l2):\n    dummy = ListNode(0)\n    curr, carry = dummy, 0\n    while l1 or l2 or carry:\n        val = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)\n        carry, digit = divmod(val, 10)\n        curr.next = ListNode(digit)\n        curr = curr.next\n        l1 = l1.next if l1 else None\n        l2 = l2.next if l2 else None\n    return dummy.next\n```',
    timeComplexity: 'O(max(m,n))',
    spaceComplexity: 'O(max(m,n))',
  },
  {
    leetcodeId: 206,
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: Difficulty.EASY,
    category: Category.LINKED_LIST,
    description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: 'The list is reversed in place.',
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
        explanation: 'The two-element list is reversed.',
      },
    ],
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000',
    ],
    hints: [
      'A linked list can be reversed either iteratively or recursively.',
      'For iterative: use three pointers — prev, curr, and next.',
      'For recursive: the base case is when head is null or head.next is null.',
    ],
    tags: ['Linked List', 'Recursion'],
    starterCode: {
      python: 'class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        pass\n',
      javascript: 'var reverseList = function(head) {\n    \n};\n',
      typescript: 'function reverseList(head: ListNode | null): ListNode | null {\n    \n};\n',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};\n',
    },
    solution:
      'Iterative reversal with prev/curr pointers.\n\n```python\ndef reverseList(self, head):\n    prev, curr = None, head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },

  // ─── TREE ─────────────────────────────────────────────────────────────────
  {
    leetcodeId: 104,
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    difficulty: Difficulty.EASY,
    category: Category.TREE,
    description:
      'Given the `root` of a binary tree, return its maximum depth.\n\nA binary tree\'s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '3',
        explanation: 'The tree has a maximum depth of 3.',
      },
      {
        input: 'root = [1,null,2]',
        output: '2',
        explanation: 'The tree has a maximum depth of 2.',
      },
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 10^4].',
      '-100 <= Node.val <= 100',
    ],
    hints: [
      'Think recursively: the depth of a tree is 1 + the max depth of its subtrees.',
      'The base case is when root is null — return 0.',
      'You can also solve this iteratively using BFS (level-order traversal).',
    ],
    tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    starterCode: {
      python: 'class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        pass\n',
      javascript: 'var maxDepth = function(root) {\n    \n};\n',
      typescript: 'function maxDepth(root: TreeNode | null): number {\n    \n};\n',
      java: 'class Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};\n',
    },
    solution:
      'Recursive DFS.\n\n```python\ndef maxDepth(self, root):\n    if not root:\n        return 0\n    return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h) where h is tree height',
  },
  {
    leetcodeId: 102,
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order-traversal',
    difficulty: Difficulty.MEDIUM,
    category: Category.TREE,
    description:
      'Given the `root` of a binary tree, return the level order traversal of its nodes\' values (i.e., from left to right, level by level).',
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]',
        explanation: 'Level 1: [3], Level 2: [9, 20], Level 3: [15, 7].',
      },
      {
        input: 'root = [1]',
        output: '[[1]]',
        explanation: 'Only one node at the root level.',
      },
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 2000].',
      '-1000 <= Node.val <= 1000',
    ],
    hints: [
      'Use a queue (BFS) to process nodes level by level.',
      'At the start of each level, record the current queue size — that many nodes belong to this level.',
      'After processing each level, append the collected values to the result.',
    ],
    tags: ['Tree', 'Breadth-First Search', 'Binary Tree'],
    starterCode: {
      python: 'class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        pass\n',
      javascript: 'var levelOrder = function(root) {\n    \n};\n',
      typescript: 'function levelOrder(root: TreeNode | null): number[][] {\n    \n};\n',
      java: 'class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        \n    }\n};\n',
    },
    solution:
      'BFS with a queue.\n\n```python\nfrom collections import deque\ndef levelOrder(self, root):\n    if not root: return []\n    result, queue = [], deque([root])\n    while queue:\n        level = []\n        for _ in range(len(queue)):\n            node = queue.popleft()\n            level.append(node.val)\n            if node.left: queue.append(node.left)\n            if node.right: queue.append(node.right)\n        result.append(level)\n    return result\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },
  {
    leetcodeId: 235,
    title: 'Lowest Common Ancestor of a Binary Search Tree',
    slug: 'lowest-common-ancestor-of-a-binary-search-tree',
    difficulty: Difficulty.MEDIUM,
    category: Category.TREE,
    description:
      'Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.\n\nThe lowest common ancestor is defined between two nodes `p` and `q` as the lowest node in `T` that has both `p` and `q` as descendants (where we allow a node to be a descendant of itself).',
    examples: [
      {
        input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8',
        output: '6',
        explanation: 'The LCA of nodes 2 and 8 is 6.',
      },
      {
        input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4',
        output: '2',
        explanation: 'The LCA of nodes 2 and 4 is 2, since a node can be a descendant of itself.',
      },
    ],
    constraints: [
      'The number of nodes in the tree is in the range [2, 10^5].',
      '-10^9 <= Node.val <= 10^9',
      'All Node.val are unique.',
      'p != q',
      'p and q will exist in the BST.',
    ],
    hints: [
      'Exploit the BST property: left subtree values are smaller, right subtree values are larger.',
      'If both p and q are smaller than root, the LCA is in the left subtree.',
      'If both p and q are larger than root, the LCA is in the right subtree.',
      'Otherwise, root is the LCA.',
    ],
    tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'],
    starterCode: {
      python: 'class Solution:\n    def lowestCommonAncestor(self, root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:\n        pass\n',
      javascript: 'var lowestCommonAncestor = function(root, p, q) {\n    \n};\n',
      typescript: 'function lowestCommonAncestor(root: TreeNode | null, p: TreeNode | null, q: TreeNode | null): TreeNode | null {\n    \n};\n',
      java: 'class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        \n    }\n};\n',
    },
    solution:
      'Use BST property to navigate directly.\n\n```python\ndef lowestCommonAncestor(self, root, p, q):\n    while root:\n        if p.val < root.val and q.val < root.val:\n            root = root.left\n        elif p.val > root.val and q.val > root.val:\n            root = root.right\n        else:\n            return root\n```',
    timeComplexity: 'O(h) where h is tree height',
    spaceComplexity: 'O(1)',
  },

  // ─── GRAPH ────────────────────────────────────────────────────────────────
  {
    leetcodeId: 200,
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: Difficulty.MEDIUM,
    category: Category.GRAPH,
    description:
      'Given an `m x n` 2D binary grid `grid` which represents a map of `\'1\'`s (land) and `\'0\'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: '1',
        explanation: 'All land cells are connected, forming a single island.',
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: '3',
        explanation: 'There are three separate islands.',
      },
    ],
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300',
      "grid[i][j] is '0' or '1'.",
    ],
    hints: [
      'Think of this as a connected components problem.',
      'Use DFS or BFS starting from each unvisited land cell.',
      "When you visit a cell, mark it as visited (e.g., change '1' to '0') to avoid revisiting.",
    ],
    tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'],
    starterCode: {
      python: 'class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        pass\n',
      javascript: 'var numIslands = function(grid) {\n    \n};\n',
      typescript: 'function numIslands(grid: string[][]): number {\n    \n};\n',
      java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};\n',
    },
    solution:
      "DFS flood-fill approach.\n\n```python\ndef numIslands(self, grid):\n    count = 0\n    def dfs(r, c):\n        if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]) or grid[r][c] != '1':\n            return\n        grid[r][c] = '0'\n        dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)\n    for r in range(len(grid)):\n        for c in range(len(grid[0])):\n            if grid[r][c] == '1':\n                dfs(r, c)\n                count += 1\n    return count\n```",
    timeComplexity: 'O(m*n)',
    spaceComplexity: 'O(m*n)',
  },
  {
    leetcodeId: 133,
    title: 'Clone Graph',
    slug: 'clone-graph',
    difficulty: Difficulty.MEDIUM,
    category: Category.GRAPH,
    description:
      "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.\n\nEach node in the graph contains a value (`int`) and a list of its neighbors (`List[Node]`).",
    examples: [
      {
        input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]',
        output: '[[2,4],[1,3],[2,4],[1,3]]',
        explanation: 'The graph has 4 nodes. Node 1 is connected to 2 and 4, etc.',
      },
      {
        input: 'adjList = [[]]',
        output: '[[]]',
        explanation: 'The graph contains a single node with no neighbors.',
      },
    ],
    constraints: [
      'The number of nodes in the graph is in the range [0, 100].',
      '1 <= Node.val <= 100',
      'Node.val is unique for each node.',
      'There are no repeated edges and no self-loops in the graph.',
      'The Graph is connected and all nodes can be visited starting from the given node.',
    ],
    hints: [
      'Use a hash map to map original nodes to their clones.',
      'Use DFS or BFS to traverse all nodes.',
      'Before creating a clone, check if the node has already been cloned to handle cycles.',
    ],
    tags: ['Hash Table', 'Depth-First Search', 'Breadth-First Search', 'Graph'],
    starterCode: {
      python: 'class Solution:\n    def cloneGraph(self, node: Optional[\'Node\']) -> Optional[\'Node\']:\n        pass\n',
      javascript: 'var cloneGraph = function(node) {\n    \n};\n',
      typescript: 'function cloneGraph(node: Node | null): Node | null {\n    \n};\n',
      java: 'class Solution {\n    public Node cloneGraph(Node node) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    Node* cloneGraph(Node* node) {\n        \n    }\n};\n',
    },
    solution:
      'DFS with a visited map.\n\n```python\ndef cloneGraph(self, node):\n    if not node: return None\n    visited = {}\n    def dfs(n):\n        if n in visited: return visited[n]\n        clone = Node(n.val)\n        visited[n] = clone\n        for neighbor in n.neighbors:\n            clone.neighbors.append(dfs(neighbor))\n        return clone\n    return dfs(node)\n```',
    timeComplexity: 'O(V+E)',
    spaceComplexity: 'O(V)',
  },

  // ─── DYNAMIC PROGRAMMING ─────────────────────────────────────────────────
  {
    leetcodeId: 70,
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: Difficulty.EASY,
    category: Category.DYNAMIC_PROGRAMMING,
    description:
      'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?',
    examples: [
      {
        input: 'n = 2',
        output: '2',
        explanation: 'There are two ways to climb to the top: 1+1 and 2.',
      },
      {
        input: 'n = 3',
        output: '3',
        explanation: 'There are three ways: 1+1+1, 1+2, and 2+1.',
      },
    ],
    constraints: ['1 <= n <= 45'],
    hints: [
      'To reach step n, you must have come from step n-1 or step n-2.',
      'This follows the Fibonacci sequence pattern.',
      'You only need the last two values, so O(1) space is achievable.',
    ],
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    starterCode: {
      python: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass\n',
      javascript: 'var climbStairs = function(n) {\n    \n};\n',
      typescript: 'function climbStairs(n: number): number {\n    \n};\n',
      java: 'class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};\n',
    },
    solution:
      'Fibonacci-style DP.\n\n```python\ndef climbStairs(self, n):\n    a, b = 1, 1\n    for _ in range(n - 1):\n        a, b = b, a + b\n    return b\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },
  {
    leetcodeId: 300,
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    difficulty: Difficulty.MEDIUM,
    category: Category.DYNAMIC_PROGRAMMING,
    description:
      'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.',
    examples: [
      {
        input: 'nums = [10,9,2,5,3,7,101,18]',
        output: '4',
        explanation: 'The longest increasing subsequence is [2,3,7,101], therefore the length is 4.',
      },
      {
        input: 'nums = [0,1,0,3,2,3]',
        output: '4',
        explanation: 'The longest increasing subsequence is [0,1,2,3].',
      },
    ],
    constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
    hints: [
      'Let dp[i] = length of LIS ending at index i.',
      'For each i, look back at all j < i where nums[j] < nums[i].',
      'A binary search approach can achieve O(n log n) using a patience sorting idea.',
    ],
    tags: ['Array', 'Binary Search', 'Dynamic Programming'],
    starterCode: {
      python: 'class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        pass\n',
      javascript: 'var lengthOfLIS = function(nums) {\n    \n};\n',
      typescript: 'function lengthOfLIS(nums: number[]): number {\n    \n};\n',
      java: 'class Solution {\n    public int lengthOfLIS(int[] nums) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        \n    }\n};\n',
    },
    solution:
      'O(n log n) with patience sorting (binary search on a tails array).\n\n```python\nimport bisect\ndef lengthOfLIS(self, nums):\n    tails = []\n    for num in nums:\n        pos = bisect.bisect_left(tails, num)\n        if pos == len(tails):\n            tails.append(num)\n        else:\n            tails[pos] = num\n    return len(tails)\n```',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
  },
  {
    leetcodeId: 322,
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: Difficulty.MEDIUM,
    category: Category.DYNAMIC_PROGRAMMING,
    description:
      'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.',
    examples: [
      {
        input: 'coins = [1,5,11], amount = 11',
        output: '1',
        explanation: 'One coin of denomination 11.',
      },
      {
        input: 'coins = [2], amount = 3',
        output: '-1',
        explanation: 'Cannot make 3 from only 2-denominations coins.',
      },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    hints: [
      'Think bottom-up: dp[i] = min coins needed for amount i.',
      'For each amount, try every coin denomination.',
      'Initialize dp[0] = 0 and all others to infinity.',
    ],
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    starterCode: {
      python: 'class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        pass\n',
      javascript: 'var coinChange = function(coins, amount) {\n    \n};\n',
      typescript: 'function coinChange(coins: number[], amount: number): number {\n    \n};\n',
      java: 'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};\n',
    },
    solution:
      'Bottom-up DP.\n\n```python\ndef coinChange(self, coins, amount):\n    dp = [float("inf")] * (amount + 1)\n    dp[0] = 0\n    for a in range(1, amount + 1):\n        for c in coins:\n            if a - c >= 0:\n                dp[a] = min(dp[a], dp[a - c] + 1)\n    return dp[amount] if dp[amount] != float("inf") else -1\n```',
    timeComplexity: 'O(amount * len(coins))',
    spaceComplexity: 'O(amount)',
  },

  // ─── BINARY SEARCH ────────────────────────────────────────────────────────
  {
    leetcodeId: 704,
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: Difficulty.EASY,
    category: Category.BINARY_SEARCH,
    description:
      'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4.',
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1.',
      },
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All the integers in nums are unique.', 'nums is sorted in ascending order.'],
    hints: [
      'Maintain left and right pointers. Compute mid = (left + right) // 2.',
      'If nums[mid] == target, return mid.',
      'If nums[mid] < target, search the right half; otherwise, search the left half.',
    ],
    tags: ['Array', 'Binary Search'],
    starterCode: {
      python: 'class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        pass\n',
      javascript: 'var search = function(nums, target) {\n    \n};\n',
      typescript: 'function search(nums: number[], target: number): number {\n    \n};\n',
      java: 'class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};\n',
    },
    solution:
      'Classic binary search.\n\n```python\ndef search(self, nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n```',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
  },
  {
    leetcodeId: 33,
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    difficulty: Difficulty.MEDIUM,
    category: Category.BINARY_SEARCH,
    description:
      'There is an integer array `nums` sorted in ascending order (with distinct values). Prior to being passed to your function, `nums` is possibly rotated at an unknown pivot index `k`.\n\nGiven the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
    examples: [
      {
        input: 'nums = [4,5,6,7,0,1,2], target = 0',
        output: '4',
        explanation: 'Target 0 is found at index 4.',
      },
      {
        input: 'nums = [4,5,6,7,0,1,2], target = 3',
        output: '-1',
        explanation: 'Target 3 is not in the array.',
      },
    ],
    constraints: ['1 <= nums.length <= 5000', '-10^4 <= nums[i] <= 10^4', 'All values of nums are unique.', 'nums is an ascending array that is possibly rotated.', '-10^4 <= target <= 10^4'],
    hints: [
      'At mid, at least one side (left or right) must be sorted.',
      'Check if the target is within the sorted half; if so, search there; otherwise, search the other half.',
      'Determine which half is sorted by comparing nums[left] with nums[mid].',
    ],
    tags: ['Array', 'Binary Search'],
    starterCode: {
      python: 'class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        pass\n',
      javascript: 'var search = function(nums, target) {\n    \n};\n',
      typescript: 'function search(nums: number[], target: number): number {\n    \n};\n',
      java: 'class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};\n',
    },
    solution:
      'Modified binary search checking which half is sorted.\n\n```python\ndef search(self, nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[left] <= nums[mid]:  # left half sorted\n            if nums[left] <= target < nums[mid]:\n                right = mid - 1\n            else:\n                left = mid + 1\n        else:  # right half sorted\n            if nums[mid] < target <= nums[right]:\n                left = mid + 1\n            else:\n                right = mid - 1\n    return -1\n```',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
  },

  // ─── HASH TABLE ───────────────────────────────────────────────────────────
  {
    leetcodeId: 146,
    title: 'LRU Cache',
    slug: 'lru-cache',
    difficulty: Difficulty.MEDIUM,
    category: Category.HASH_TABLE,
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size `capacity`.\n- `int get(int key)` Return the value of the `key` if the key exists, otherwise return `-1`.\n- `void put(int key, int value)` Update the value of the `key` if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the `capacity` from this operation, evict the least recently used key.\n\nThe functions `get` and `put` must each run in `O(1)` average time complexity.',
    examples: [
      {
        input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: '[null,null,null,1,null,-1,null,-1,3,4]',
        explanation: 'After 4 puts with capacity 2, get(1) returns -1 as 1 was evicted.',
      },
      {
        input: '["LRUCache","put","get"]\n[[1],[2,1],[2]]',
        output: '[null,null,1]',
        explanation: 'Put key=2,value=1 then get key=2 returns 1.',
      },
    ],
    constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5', 'At most 2 * 10^5 calls will be made to get and put.'],
    hints: [
      'Use a doubly linked list combined with a hash map.',
      'The hash map provides O(1) access; the doubly linked list maintains order.',
      'On every access (get or put), move the node to the head (most recently used).',
      'On eviction, remove the tail node (least recently used).',
    ],
    tags: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
    starterCode: {
      python: 'class LRUCache:\n\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass\n',
      javascript: 'class LRUCache {\n    constructor(capacity) {\n        \n    }\n    get(key) {\n        \n    }\n    put(key, value) {\n        \n    }\n}\n',
      typescript: 'class LRUCache {\n    constructor(capacity: number) {\n        \n    }\n    get(key: number): number {\n        \n    }\n    put(key: number, value: number): void {\n        \n    }\n}\n',
      java: 'class LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    public int get(int key) {\n        \n    }\n    public void put(int key, int value) {\n        \n    }\n}\n',
      cpp: 'class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        \n    }\n    int get(int key) {\n        \n    }\n    void put(int key, int value) {\n        \n    }\n};\n',
    },
    solution:
      'OrderedDict (Python) or HashMap + Doubly Linked List.\n\n```python\nfrom collections import OrderedDict\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cache = OrderedDict()\n        self.capacity = capacity\n    def get(self, key):\n        if key not in self.cache: return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    def put(self, key, value):\n        if key in self.cache:\n            self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.capacity:\n            self.cache.popitem(last=False)\n```',
    timeComplexity: 'O(1) for both get and put',
    spaceComplexity: 'O(capacity)',
  },
  {
    leetcodeId: 49,
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    difficulty: Difficulty.MEDIUM,
    category: Category.HASH_TABLE,
    description:
      'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        explanation: 'The three groups of anagrams.',
      },
      {
        input: 'strs = [""]',
        output: '[[""]]',
        explanation: 'Single empty string forms its own group.',
      },
    ],
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters.'],
    hints: [
      'Two strings are anagrams if and only if their sorted characters are equal.',
      'Use a hash map with the sorted string as the key.',
      'Alternatively, use a character-count tuple of 26 values as the key.',
    ],
    tags: ['Array', 'Hash Table', 'String', 'Sorting'],
    starterCode: {
      python: 'class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        pass\n',
      javascript: 'var groupAnagrams = function(strs) {\n    \n};\n',
      typescript: 'function groupAnagrams(strs: string[]): string[][] {\n    \n};\n',
      java: 'class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};\n',
    },
    solution:
      'Group by sorted-string key.\n\n```python\nfrom collections import defaultdict\ndef groupAnagrams(self, strs):\n    groups = defaultdict(list)\n    for s in strs:\n        groups[tuple(sorted(s))].append(s)\n    return list(groups.values())\n```',
    timeComplexity: 'O(n * k log k) where k is max string length',
    spaceComplexity: 'O(n * k)',
  },

  // ─── TWO POINTERS ─────────────────────────────────────────────────────────
  {
    leetcodeId: 15,
    title: '3Sum',
    slug: '3sum',
    difficulty: Difficulty.MEDIUM,
    category: Category.TWO_POINTERS,
    description:
      'Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.',
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
        explanation: 'Two unique triplets sum to zero.',
      },
      {
        input: 'nums = [0,0,0]',
        output: '[[0,0,0]]',
        explanation: 'Only one triplet.',
      },
    ],
    constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    hints: [
      'Sort the array first to make deduplication easier.',
      'Fix the first element and use two pointers for the remaining pair.',
      'Skip duplicate values for the fixed element and both pointers.',
    ],
    tags: ['Array', 'Two Pointers', 'Sorting'],
    starterCode: {
      python: 'class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        pass\n',
      javascript: 'var threeSum = function(nums) {\n    \n};\n',
      typescript: 'function threeSum(nums: number[]): number[][] {\n    \n};\n',
      java: 'class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};\n',
    },
    solution:
      'Sort + two pointer.\n\n```python\ndef threeSum(self, nums):\n    nums.sort()\n    result = []\n    for i in range(len(nums) - 2):\n        if i > 0 and nums[i] == nums[i-1]: continue\n        left, right = i + 1, len(nums) - 1\n        while left < right:\n            s = nums[i] + nums[left] + nums[right]\n            if s == 0:\n                result.append([nums[i], nums[left], nums[right]])\n                while left < right and nums[left] == nums[left+1]: left += 1\n                while left < right and nums[right] == nums[right-1]: right -= 1\n                left += 1; right -= 1\n            elif s < 0:\n                left += 1\n            else:\n                right -= 1\n    return result\n```',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(n) for the output',
  },
  {
    leetcodeId: 11,
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: Difficulty.MEDIUM,
    category: Category.TWO_POINTERS,
    description:
      'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `ith` line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\nNotice that you may not slant the container.',
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The lines at indices 1 and 8 form a container holding 49 units of water.',
      },
      {
        input: 'height = [1,1]',
        output: '1',
        explanation: 'The two lines form a container of width 1 and height 1.',
      },
    ],
    constraints: ['n == height.length', '2 <= n <= 10^5', '0 <= height[i] <= 10^4'],
    hints: [
      'Use two pointers starting from both ends of the array.',
      'The area is determined by the shorter line times the distance between pointers.',
      'Move the pointer pointing to the shorter line inward.',
    ],
    tags: ['Array', 'Two Pointers', 'Greedy'],
    starterCode: {
      python: 'class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        pass\n',
      javascript: 'var maxArea = function(height) {\n    \n};\n',
      typescript: 'function maxArea(height: number[]): number {\n    \n};\n',
      java: 'class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};\n',
    },
    solution:
      'Two pointers, always move the shorter side.\n\n```python\ndef maxArea(self, height):\n    left, right = 0, len(height) - 1\n    max_water = 0\n    while left < right:\n        water = min(height[left], height[right]) * (right - left)\n        max_water = max(max_water, water)\n        if height[left] < height[right]:\n            left += 1\n        else:\n            right -= 1\n    return max_water\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },

  // ─── BACKTRACKING ─────────────────────────────────────────────────────────
  {
    leetcodeId: 46,
    title: 'Permutations',
    slug: 'permutations',
    difficulty: Difficulty.MEDIUM,
    category: Category.BACKTRACKING,
    description:
      'Given an array `nums` of distinct integers, return all the possible permutations. You can return the answer in any order.',
    examples: [
      {
        input: 'nums = [1,2,3]',
        output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',
        explanation: 'All 6 permutations of 3 distinct elements.',
      },
      {
        input: 'nums = [0,1]',
        output: '[[0,1],[1,0]]',
        explanation: 'Two permutations of two elements.',
      },
    ],
    constraints: ['1 <= nums.length <= 6', '-10 <= nums[i] <= 10', 'All the integers of nums are unique.'],
    hints: [
      'Use backtracking: build a permutation step by step.',
      'At each step, choose any unused number and recurse.',
      'When the current permutation is the same length as nums, add it to results.',
    ],
    tags: ['Array', 'Backtracking'],
    starterCode: {
      python: 'class Solution:\n    def permute(self, nums: List[int]) -> List[List[int]]:\n        pass\n',
      javascript: 'var permute = function(nums) {\n    \n};\n',
      typescript: 'function permute(nums: number[]): number[][] {\n    \n};\n',
      java: 'class Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> permute(vector<int>& nums) {\n        \n    }\n};\n',
    },
    solution:
      'Backtracking with a used-set.\n\n```python\ndef permute(self, nums):\n    result = []\n    def backtrack(path, remaining):\n        if not remaining:\n            result.append(path[:])\n            return\n        for i, num in enumerate(remaining):\n            path.append(num)\n            backtrack(path, remaining[:i] + remaining[i+1:])\n            path.pop()\n    backtrack([], nums)\n    return result\n```',
    timeComplexity: 'O(n * n!)',
    spaceComplexity: 'O(n)',
  },
  {
    leetcodeId: 79,
    title: 'Word Search',
    slug: 'word-search',
    difficulty: Difficulty.MEDIUM,
    category: Category.BACKTRACKING,
    description:
      'Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.',
    examples: [
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: 'true',
        explanation: 'The word ABCCED can be traced through the grid.',
      },
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"',
        output: 'false',
        explanation: 'ABCB cannot be formed without reusing cell B.',
      },
    ],
    constraints: [
      'm == board.length',
      'n = board[i].length',
      '1 <= m, n <= 6',
      '1 <= word.length <= 15',
      'board and word consists of only lowercase and uppercase English letters.',
    ],
    hints: [
      'Use DFS with backtracking starting from each cell matching word[0].',
      'Mark a cell as visited before recursing and unmark it after.',
      'If you go out of bounds, hit a visited cell, or a character mismatch, return false.',
    ],
    tags: ['Array', 'String', 'Backtracking', 'Matrix'],
    starterCode: {
      python: 'class Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        pass\n',
      javascript: 'var exist = function(board, word) {\n    \n};\n',
      typescript: 'function exist(board: string[][], word: string): boolean {\n    \n};\n',
      java: 'class Solution {\n    public boolean exist(char[][] board, String word) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        \n    }\n};\n',
    },
    solution:
      'DFS backtracking.\n\n```python\ndef exist(self, board, word):\n    m, n = len(board), len(board[0])\n    def dfs(r, c, idx):\n        if idx == len(word): return True\n        if r < 0 or r >= m or c < 0 or c >= n or board[r][c] != word[idx]: return False\n        tmp, board[r][c] = board[r][c], "#"\n        found = dfs(r+1,c,idx+1) or dfs(r-1,c,idx+1) or dfs(r,c+1,idx+1) or dfs(r,c-1,idx+1)\n        board[r][c] = tmp\n        return found\n    return any(dfs(r, c, 0) for r in range(m) for c in range(n))\n```',
    timeComplexity: 'O(m * n * 4^L) where L is word length',
    spaceComplexity: 'O(L)',
  },

  // ─── STACK / QUEUE ────────────────────────────────────────────────────────
  {
    leetcodeId: 84,
    title: 'Largest Rectangle in Histogram',
    slug: 'largest-rectangle-in-histogram',
    difficulty: Difficulty.HARD,
    category: Category.STACK_QUEUE,
    description:
      'Given an array of integers `heights` representing the histogram\'s bar height where the width of each bar is `1`, return the area of the largest rectangle in the histogram.',
    examples: [
      {
        input: 'heights = [2,1,5,6,2,3]',
        output: '10',
        explanation: 'The largest rectangle spans bars at index 2 and 3, each of height 5 and 6 — the limiting height is 5, width 2, area = 10.',
      },
      {
        input: 'heights = [2,4]',
        output: '4',
        explanation: 'The largest rectangle is just the second bar of height 4.',
      },
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
    hints: [
      'Use a monotonic increasing stack.',
      'When a shorter bar is encountered, pop bars from the stack and compute areas.',
      'Use index -1 as a sentinel to handle the left boundary.',
    ],
    tags: ['Array', 'Stack', 'Monotonic Stack'],
    starterCode: {
      python: 'class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        pass\n',
      javascript: 'var largestRectangleArea = function(heights) {\n    \n};\n',
      typescript: 'function largestRectangleArea(heights: number[]): number {\n    \n};\n',
      java: 'class Solution {\n    public int largestRectangleArea(int[] heights) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        \n    }\n};\n',
    },
    solution:
      'Monotonic stack.\n\n```python\ndef largestRectangleArea(self, heights):\n    stack = [-1]\n    max_area = 0\n    for i, h in enumerate(heights):\n        while stack[-1] != -1 and heights[stack[-1]] >= h:\n            height = heights[stack.pop()]\n            width = i - stack[-1] - 1\n            max_area = max(max_area, height * width)\n        stack.append(i)\n    while stack[-1] != -1:\n        height = heights[stack.pop()]\n        width = len(heights) - stack[-1] - 1\n        max_area = max(max_area, height * width)\n    return max_area\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
  },

  // ─── MATH ─────────────────────────────────────────────────────────────────
  {
    leetcodeId: 9,
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: Difficulty.EASY,
    category: Category.MATH,
    description:
      'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.',
    examples: [
      {
        input: 'x = 121',
        output: 'true',
        explanation: '121 reads as 121 from left to right and from right to left.',
      },
      {
        input: 'x = -121',
        output: 'false',
        explanation: 'From left to right, it reads -121. From right to left, it becomes 121-.',
      },
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    hints: [
      'Negative numbers are never palindromes.',
      'Numbers ending in 0 (except 0 itself) are never palindromes.',
      'Reverse only half the digits to avoid overflow.',
    ],
    tags: ['Math'],
    starterCode: {
      python: 'class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass\n',
      javascript: 'var isPalindrome = function(x) {\n    \n};\n',
      typescript: 'function isPalindrome(x: number): boolean {\n    \n};\n',
      java: 'class Solution {\n    public boolean isPalindrome(int x) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool isPalindrome(int x) {\n        \n    }\n};\n',
    },
    solution:
      'Reverse half the number.\n\n```python\ndef isPalindrome(self, x):\n    if x < 0 or (x % 10 == 0 and x != 0): return False\n    rev = 0\n    while x > rev:\n        rev = rev * 10 + x % 10\n        x //= 10\n    return x == rev or x == rev // 10\n```',
    timeComplexity: 'O(log x)',
    spaceComplexity: 'O(1)',
  },
  {
    leetcodeId: 50,
    title: 'Pow(x, n)',
    slug: 'powx-n',
    difficulty: Difficulty.MEDIUM,
    category: Category.MATH,
    description:
      'Implement `pow(x, n)`, which calculates `x` raised to the power `n` (i.e., `x^n`).',
    examples: [
      {
        input: 'x = 2.00000, n = 10',
        output: '1024.00000',
        explanation: '2^10 = 1024.',
      },
      {
        input: 'x = 2.10000, n = 3',
        output: '9.26100',
        explanation: '2.1^3 = 9.261.',
      },
    ],
    constraints: ['-100.0 < x < 100.0', '-2^31 <= n <= 2^31-1', 'n is an integer.', '-10^4 <= x^n <= 10^4'],
    hints: [
      'Use fast exponentiation (exponentiation by squaring).',
      'If n is even, pow(x, n) = pow(x*x, n/2).',
      'Handle negative n by computing pow(1/x, -n).',
    ],
    tags: ['Math', 'Recursion'],
    starterCode: {
      python: 'class Solution:\n    def myPow(self, x: float, n: int) -> float:\n        pass\n',
      javascript: 'var myPow = function(x, n) {\n    \n};\n',
      typescript: 'function myPow(x: number, n: number): number {\n    \n};\n',
      java: 'class Solution {\n    public double myPow(double x, int n) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    double myPow(double x, int n) {\n        \n    }\n};\n',
    },
    solution:
      'Fast exponentiation by squaring.\n\n```python\ndef myPow(self, x, n):\n    if n < 0:\n        x, n = 1/x, -n\n    result = 1\n    while n:\n        if n % 2 == 1:\n            result *= x\n        x *= x\n        n //= 2\n    return result\n```',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
  },

  // ─── GREEDY ───────────────────────────────────────────────────────────────
  {
    leetcodeId: 55,
    title: 'Jump Game',
    slug: 'jump-game',
    difficulty: Difficulty.MEDIUM,
    category: Category.GREEDY,
    description:
      'You are given an integer array `nums`. You are initially positioned at the first index of the array. Each element in the array represents your maximum jump length at that position.\n\nReturn `true` if you can reach the last index, or `false` otherwise.',
    examples: [
      {
        input: 'nums = [2,3,1,1,4]',
        output: 'true',
        explanation: 'Jump 1 step from index 0 to 1, then 3 steps to the last index.',
      },
      {
        input: 'nums = [3,2,1,0,4]',
        output: 'false',
        explanation: 'You will always arrive at index 3 with max value 0, making it impossible to reach the last index.',
      },
    ],
    constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],
    hints: [
      'Track the furthest index reachable at each step.',
      'If the current index exceeds the furthest reachable index, you cannot proceed.',
      'If the furthest reachable index reaches or exceeds the last index, return true.',
    ],
    tags: ['Array', 'Dynamic Programming', 'Greedy'],
    starterCode: {
      python: 'class Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        pass\n',
      javascript: 'var canJump = function(nums) {\n    \n};\n',
      typescript: 'function canJump(nums: number[]): boolean {\n    \n};\n',
      java: 'class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        \n    }\n};\n',
    },
    solution:
      'Greedy with a max-reach variable.\n\n```python\ndef canJump(self, nums):\n    max_reach = 0\n    for i, jump in enumerate(nums):\n        if i > max_reach: return False\n        max_reach = max(max_reach, i + jump)\n    return True\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },
  {
    leetcodeId: 121,
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: Difficulty.EASY,
    category: Category.GREEDY,
    description:
      'You are given an array `prices` where `prices[i]` is the price of a given stock on the `ith` day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.',
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'No transaction is done since prices only decrease.',
      },
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    hints: [
      'Track the minimum price seen so far as you iterate.',
      'At each step, the potential profit is current price minus the minimum seen so far.',
      'Keep updating the maximum profit.',
    ],
    tags: ['Array', 'Dynamic Programming'],
    starterCode: {
      python: 'class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        pass\n',
      javascript: 'var maxProfit = function(prices) {\n    \n};\n',
      typescript: 'function maxProfit(prices: number[]): number {\n    \n};\n',
      java: 'class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};\n',
    },
    solution:
      'Single pass tracking min price.\n\n```python\ndef maxProfit(self, prices):\n    min_price = float("inf")\n    max_profit = 0\n    for price in prices:\n        min_price = min(min_price, price)\n        max_profit = max(max_profit, price - min_price)\n    return max_profit\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  },

  // ─── HEAP ─────────────────────────────────────────────────────────────────
  {
    leetcodeId: 215,
    title: 'Kth Largest Element in an Array',
    slug: 'kth-largest-element-in-an-array',
    difficulty: Difficulty.MEDIUM,
    category: Category.HEAP,
    description:
      'Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.\n\nNote that it is the `k`th largest element in the sorted order, not the `k`th distinct element.\n\nCan you solve it without sorting?',
    examples: [
      {
        input: 'nums = [3,2,1,5,6,4], k = 2',
        output: '5',
        explanation: 'The 2nd largest element is 5.',
      },
      {
        input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4',
        output: '4',
        explanation: 'The 4th largest element is 4.',
      },
    ],
    constraints: ['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: [
      'Use a min-heap of size k.',
      'Push elements into the heap; when size exceeds k, pop the smallest.',
      'The top of the heap is the kth largest element.',
    ],
    tags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap (Priority Queue)', 'Quickselect'],
    starterCode: {
      python: 'class Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        pass\n',
      javascript: 'var findKthLargest = function(nums, k) {\n    \n};\n',
      typescript: 'function findKthLargest(nums: number[], k: number): number {\n    \n};\n',
      java: 'class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};\n',
    },
    solution:
      'Min-heap of size k.\n\n```python\nimport heapq\ndef findKthLargest(self, nums, k):\n    heap = []\n    for num in nums:\n        heapq.heappush(heap, num)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]\n```',
    timeComplexity: 'O(n log k)',
    spaceComplexity: 'O(k)',
  },
  {
    leetcodeId: 295,
    title: 'Find Median from Data Stream',
    slug: 'find-median-from-data-stream',
    difficulty: Difficulty.HARD,
    category: Category.HEAP,
    description:
      'The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.\n\nImplement the `MedianFinder` class:\n- `MedianFinder()` initializes the `MedianFinder` object.\n- `void addNum(int num)` adds the integer `num` from the data stream to the data structure.\n- `double findMedian()` returns the median of all elements so far.',
    examples: [
      {
        input: '["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"]\n[[],[1],[2],[],[3],[]]',
        output: '[null,null,null,1.50000,null,2.00000]',
        explanation: 'After adding 1 and 2, median is 1.5. After adding 3, median is 2.0.',
      },
      {
        input: '["MedianFinder","addNum","findMedian"]\n[[],[1],[]]',
        output: '[null,null,1.00000]',
        explanation: 'After adding 1, median is 1.0.',
      },
    ],
    constraints: ['-10^5 <= num <= 10^5', 'There will be at least one element in the data structure before calling findMedian.', 'At most 5 * 10^4 calls will be made to addNum and findMedian.'],
    hints: [
      'Use two heaps: a max-heap for the lower half and a min-heap for the upper half.',
      'Always keep the heaps balanced (sizes differ by at most 1).',
      'The median is the top of the larger heap, or the average of both tops.',
    ],
    tags: ['Two Pointers', 'Design', 'Sorting', 'Heap (Priority Queue)', 'Data Stream'],
    starterCode: {
      python: 'class MedianFinder:\n\n    def __init__(self):\n        pass\n\n    def addNum(self, num: int) -> None:\n        pass\n\n    def findMedian(self) -> float:\n        pass\n',
      javascript: 'class MedianFinder {\n    constructor() {\n        \n    }\n    addNum(num) {\n        \n    }\n    findMedian() {\n        \n    }\n}\n',
      typescript: 'class MedianFinder {\n    constructor() {\n        \n    }\n    addNum(num: number): void {\n        \n    }\n    findMedian(): number {\n        \n    }\n}\n',
      java: 'class MedianFinder {\n    public MedianFinder() {\n        \n    }\n    public void addNum(int num) {\n        \n    }\n    public double findMedian() {\n        \n    }\n}\n',
      cpp: 'class MedianFinder {\npublic:\n    MedianFinder() {\n        \n    }\n    void addNum(int num) {\n        \n    }\n    double findMedian() {\n        \n    }\n};\n',
    },
    solution:
      'Two heaps: max-heap for lower half, min-heap for upper half.\n\n```python\nimport heapq\nclass MedianFinder:\n    def __init__(self):\n        self.lo = []  # max-heap (negated)\n        self.hi = []  # min-heap\n    def addNum(self, num):\n        heapq.heappush(self.lo, -num)\n        heapq.heappush(self.hi, -heapq.heappop(self.lo))\n        if len(self.hi) > len(self.lo):\n            heapq.heappush(self.lo, -heapq.heappop(self.hi))\n    def findMedian(self):\n        if len(self.lo) > len(self.hi):\n            return -self.lo[0]\n        return (-self.lo[0] + self.hi[0]) / 2\n```',
    timeComplexity: 'O(log n) per addNum, O(1) per findMedian',
    spaceComplexity: 'O(n)',
  },

  // ─── TRIE ─────────────────────────────────────────────────────────────────
  {
    leetcodeId: 208,
    title: 'Implement Trie (Prefix Tree)',
    slug: 'implement-trie-prefix-tree',
    difficulty: Difficulty.MEDIUM,
    category: Category.TRIE,
    description:
      'A trie (pronounced as "try") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. There are various applications of this data structure, such as autocomplete and spellchecker.\n\nImplement the `Trie` class:\n- `Trie()` Initializes the trie object.\n- `void insert(String word)` Inserts the string `word` into the trie.\n- `boolean search(String word)` Returns `true` if the string `word` is in the trie, and `false` otherwise.\n- `boolean startsWith(String prefix)` Returns `true` if there is a previously inserted string that has the prefix `prefix`, and `false` otherwise.',
    examples: [
      {
        input: '["Trie","insert","search","search","startsWith","insert","search"]\n[[],["apple"],["apple"],["app"],["app"],["app"],["app"]]',
        output: '[null,null,true,false,true,null,true]',
        explanation: 'After inserting "apple", search("app") is false but startsWith("app") is true. After inserting "app", search("app") is true.',
      },
      {
        input: '["Trie","insert","search"]\n[[],["hello"],["hello"]]',
        output: '[null,null,true]',
        explanation: 'Insert "hello", then search returns true.',
      },
    ],
    constraints: ['1 <= word.length, prefix.length <= 2000', 'word and prefix consist only of lowercase English letters.', 'At most 3 * 10^4 calls in total will be made to insert, search, and startsWith.'],
    hints: [
      'Each Trie node stores a dictionary of children and a flag marking end-of-word.',
      'Insert: iterate through characters, creating nodes as needed, then mark the last node.',
      'Search and startsWith share the traversal logic; only differ in whether end-of-word is checked.',
    ],
    tags: ['Hash Table', 'String', 'Design', 'Trie'],
    starterCode: {
      python: 'class Trie:\n\n    def __init__(self):\n        pass\n\n    def insert(self, word: str) -> None:\n        pass\n\n    def search(self, word: str) -> bool:\n        pass\n\n    def startsWith(self, prefix: str) -> bool:\n        pass\n',
      javascript: 'class Trie {\n    constructor() {\n        \n    }\n    insert(word) {\n        \n    }\n    search(word) {\n        \n    }\n    startsWith(prefix) {\n        \n    }\n}\n',
      typescript: 'class Trie {\n    constructor() {\n        \n    }\n    insert(word: string): void {\n        \n    }\n    search(word: string): boolean {\n        \n    }\n    startsWith(prefix: string): boolean {\n        \n    }\n}\n',
      java: 'class Trie {\n    public Trie() {\n        \n    }\n    public void insert(String word) {\n        \n    }\n    public boolean search(String word) {\n        \n    }\n    public boolean startsWith(String prefix) {\n        \n    }\n}\n',
      cpp: 'class Trie {\npublic:\n    Trie() {\n        \n    }\n    void insert(string word) {\n        \n    }\n    bool search(string word) {\n        \n    }\n    bool startsWith(string prefix) {\n        \n    }\n};\n',
    },
    solution:
      'Dictionary-of-children trie node.\n\n```python\nclass Trie:\n    def __init__(self):\n        self.children = {}\n        self.end = False\n    def insert(self, word):\n        node = self\n        for ch in word:\n            node = node.children.setdefault(ch, Trie())\n        node.end = True\n    def _traverse(self, word):\n        node = self\n        for ch in word:\n            if ch not in node.children: return None\n            node = node.children[ch]\n        return node\n    def search(self, word):\n        node = self._traverse(word)\n        return node is not None and node.end\n    def startsWith(self, prefix):\n        return self._traverse(prefix) is not None\n```',
    timeComplexity: 'O(m) per operation where m is word/prefix length',
    spaceComplexity: 'O(m * n) total for n words',
  },

  // ─── SLIDING WINDOW ───────────────────────────────────────────────────────
  {
    leetcodeId: 76,
    title: 'Minimum Window Substring',
    slug: 'minimum-window-substring',
    difficulty: Difficulty.HARD,
    category: Category.SLIDING_WINDOW,
    description:
      'Given two strings `s` and `t` of lengths `m` and `n` respectively, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return the empty string `""`.',
    examples: [
      {
        input: 's = "ADOBECODEBANC", t = "ABC"',
        output: '"BANC"',
        explanation: 'The minimum window substring "BANC" includes all characters A, B, and C.',
      },
      {
        input: 's = "a", t = "aa"',
        output: '""',
        explanation: 'Both "a"s need to be in the window but only one is available.',
      },
    ],
    constraints: ['m == s.length', 'n == t.length', '1 <= m, n <= 10^5', 's and t consist of uppercase and lowercase English letters.'],
    hints: [
      'Use a sliding window with two pointers.',
      'Maintain a frequency count of characters needed from t.',
      'Expand right pointer to satisfy all requirements; then shrink left pointer to minimize window.',
    ],
    tags: ['Hash Table', 'String', 'Sliding Window'],
    starterCode: {
      python: 'class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        pass\n',
      javascript: 'var minWindow = function(s, t) {\n    \n};\n',
      typescript: 'function minWindow(s: string, t: string): string {\n    \n};\n',
      java: 'class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};\n',
    },
    solution:
      'Sliding window with character frequency counters.\n\n```python\nfrom collections import Counter\ndef minWindow(self, s, t):\n    need = Counter(t)\n    missing = len(t)\n    left = start = end = 0\n    for right, ch in enumerate(s, 1):\n        if need[ch] > 0:\n            missing -= 1\n        need[ch] -= 1\n        if missing == 0:\n            while need[s[left]] < 0:\n                need[s[left]] += 1\n                left += 1\n            if not end or right - left < end - start:\n                start, end = left, right\n            need[s[left]] += 1\n            missing += 1\n            left += 1\n    return s[start:end]\n```',
    timeComplexity: 'O(m + n)',
    spaceComplexity: 'O(m + n)',
  },
  {
    leetcodeId: 438,
    title: 'Find All Anagrams in a String',
    slug: 'find-all-anagrams-in-a-string',
    difficulty: Difficulty.MEDIUM,
    category: Category.SLIDING_WINDOW,
    description:
      'Given two strings `s` and `p`, return an array of all the start indices of `p`\'s anagrams in `s`. You may return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    examples: [
      {
        input: 's = "cbaebabacd", p = "abc"',
        output: '[0,6]',
        explanation: '"cba" starts at index 0, "bac" starts at index 6.',
      },
      {
        input: 's = "abab", p = "ab"',
        output: '[0,1,2]',
        explanation: '"ab" starts at 0, "ba" starts at 1, "ab" starts at 2.',
      },
    ],
    constraints: ['1 <= s.length, p.length <= 3 * 10^4', 's and p consist of lowercase English letters.'],
    hints: [
      'Use a fixed-size sliding window of length len(p).',
      'Maintain frequency counts for the current window and compare with p\'s frequency count.',
      'Slide the window one character at a time, updating counts incrementally.',
    ],
    tags: ['Hash Table', 'String', 'Sliding Window'],
    starterCode: {
      python: 'class Solution:\n    def findAnagrams(self, s: str, p: str) -> List[int]:\n        pass\n',
      javascript: 'var findAnagrams = function(s, p) {\n    \n};\n',
      typescript: 'function findAnagrams(s: string, p: string): number[] {\n    \n};\n',
      java: 'class Solution {\n    public List<Integer> findAnagrams(String s, String p) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<int> findAnagrams(string s, string p) {\n        \n    }\n};\n',
    },
    solution:
      'Fixed-size sliding window with a counter.\n\n```python\nfrom collections import Counter\ndef findAnagrams(self, s, p):\n    need = Counter(p)\n    window = Counter(s[:len(p)-1])\n    result = []\n    for i in range(len(p)-1, len(s)):\n        window[s[i]] += 1\n        if window == need:\n            result.append(i - len(p) + 1)\n        window[s[i - len(p) + 1]] -= 1\n        if window[s[i - len(p) + 1]] == 0:\n            del window[s[i - len(p) + 1]]\n    return result\n```',
    timeComplexity: 'O(m + n)',
    spaceComplexity: 'O(1) — only 26 lowercase letters',
  },

  // ─── EXTRA COVERAGE ───────────────────────────────────────────────────────
  {
    leetcodeId: 19,
    title: 'Remove Nth Node From End of List',
    slug: 'remove-nth-node-from-end-of-list',
    difficulty: Difficulty.MEDIUM,
    category: Category.LINKED_LIST,
    description:
      'Given the `head` of a linked list, remove the `n`th node from the end of the list and return its head.',
    examples: [
      {
        input: 'head = [1,2,3,4,5], n = 2',
        output: '[1,2,3,5]',
        explanation: 'The 2nd node from the end (value 4) is removed.',
      },
      {
        input: 'head = [1], n = 1',
        output: '[]',
        explanation: 'The only node is removed.',
      },
    ],
    constraints: [
      'The number of nodes in the list is sz.',
      '1 <= sz <= 30',
      '0 <= Node.val <= 100',
      '1 <= n <= sz',
    ],
    hints: [
      'Use two pointers separated by n nodes.',
      'When the fast pointer reaches the end, the slow pointer is just before the node to delete.',
      'Use a dummy head node to simplify edge cases.',
    ],
    tags: ['Linked List', 'Two Pointers'],
    starterCode: {
      python: 'class Solution:\n    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:\n        pass\n',
      javascript: 'var removeNthFromEnd = function(head, n) {\n    \n};\n',
      typescript: 'function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {\n    \n};\n',
      java: 'class Solution {\n    public ListNode removeNthFromEnd(ListNode head, int n) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    ListNode* removeNthFromEnd(ListNode* head, int n) {\n        \n    }\n};\n',
    },
    solution:
      'Two-pointer gap approach with dummy node.\n\n```python\ndef removeNthFromEnd(self, head, n):\n    dummy = ListNode(0, head)\n    fast = slow = dummy\n    for _ in range(n + 1):\n        fast = fast.next\n    while fast:\n        fast = fast.next\n        slow = slow.next\n    slow.next = slow.next.next\n    return dummy.next\n```',
    timeComplexity: 'O(L) where L is list length',
    spaceComplexity: 'O(1)',
  },
  {
    leetcodeId: 98,
    title: 'Validate Binary Search Tree',
    slug: 'validate-binary-search-tree',
    difficulty: Difficulty.MEDIUM,
    category: Category.TREE,
    description:
      'Given the `root` of a binary tree, determine if it is a valid binary search tree (BST).\n\nA valid BST is defined as follows:\n- The left subtree of a node contains only nodes with keys less than the node\'s key.\n- The right subtree of a node contains only nodes with keys greater than the node\'s key.\n- Both the left and right subtrees must also be binary search trees.',
    examples: [
      {
        input: 'root = [2,1,3]',
        output: 'true',
        explanation: '1 < 2 < 3, so it is a valid BST.',
      },
      {
        input: 'root = [5,1,4,null,null,3,6]',
        output: 'false',
        explanation: 'The root is 5 but its right child is 4, which is less than 5.',
      },
    ],
    constraints: [
      'The number of nodes in the tree is in the range [1, 10^4].',
      '-2^31 <= Node.val <= 2^31 - 1',
    ],
    hints: [
      'Pass min/max bounds down the recursion.',
      'For each node, its value must be strictly between (min, max).',
      'For the left child, update the max to the current node\'s value; for the right child, update the min.',
    ],
    tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'],
    starterCode: {
      python: 'class Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        pass\n',
      javascript: 'var isValidBST = function(root) {\n    \n};\n',
      typescript: 'function isValidBST(root: TreeNode | null): boolean {\n    \n};\n',
      java: 'class Solution {\n    public boolean isValidBST(TreeNode root) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        \n    }\n};\n',
    },
    solution:
      'Recursive with min/max bounds.\n\n```python\ndef isValidBST(self, root):\n    def validate(node, low, high):\n        if not node: return True\n        if node.val <= low or node.val >= high: return False\n        return validate(node.left, low, node.val) and validate(node.right, node.val, high)\n    return validate(root, float(\'-inf\'), float(\'inf\'))\n```',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h) where h is tree height',
  },
  {
    leetcodeId: 207,
    title: 'Course Schedule',
    slug: 'course-schedule',
    difficulty: Difficulty.MEDIUM,
    category: Category.GRAPH,
    description:
      'There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.',
    examples: [
      {
        input: 'numCourses = 2, prerequisites = [[1,0]]',
        output: 'true',
        explanation: 'Take course 0 first, then course 1.',
      },
      {
        input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]',
        output: 'false',
        explanation: 'There is a cycle: 0 depends on 1 and 1 depends on 0.',
      },
    ],
    constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000', 'prerequisites[i].length == 2', '0 <= ai, bi < numCourses', 'All the pairs prerequisites[i] are unique.'],
    hints: [
      'Model as a directed graph and detect if a cycle exists.',
      'Use DFS with three states: unvisited, visiting (in current path), visited.',
      'If during DFS you reach a node in "visiting" state, a cycle exists.',
    ],
    tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'],
    starterCode: {
      python: 'class Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        pass\n',
      javascript: 'var canFinish = function(numCourses, prerequisites) {\n    \n};\n',
      typescript: 'function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n    \n};\n',
      java: 'class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        \n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};\n',
    },
    solution:
      'Cycle detection via DFS with color states (0=unvisited, 1=visiting, 2=done).\n\n```python\ndef canFinish(self, numCourses, prerequisites):\n    graph = [[] for _ in range(numCourses)]\n    for a, b in prerequisites:\n        graph[b].append(a)\n    state = [0] * numCourses\n    def dfs(node):\n        if state[node] == 1: return False  # cycle\n        if state[node] == 2: return True\n        state[node] = 1\n        for nei in graph[node]:\n            if not dfs(nei): return False\n        state[node] = 2\n        return True\n    return all(dfs(i) for i in range(numCourses))\n```',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
  },
]

async function main() {
  console.log('Seeding database with 30 LeetCode problems...')

  // Clear existing problems to avoid duplicate key conflicts on re-seed
  await prisma.userProgress.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.problem.deleteMany()

  for (const problem of problems) {
    await prisma.problem.create({ data: problem })
    console.log(`  Created: [${problem.leetcodeId}] ${problem.title}`)
  }

  console.log(`\nDone! Seeded ${problems.length} problems.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
