export interface ScanResult {
  safe: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  sanitized: string;
  confidence: number;
}

interface InjectionPattern {
  pattern: RegExp;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  {
    pattern: /ignore (previous|above|all) instructions/i,
    label: 'Instruction Override',
    severity: 'critical',
  },
  {
    pattern: /you are now|pretend you are|act as if/i,
    label: 'Role Hijacking',
    severity: 'high',
  },
  {
    pattern: /system prompt|<system>|###system/i,
    label: 'System Prompt Leak',
    severity: 'critical',
  },
  {
    pattern: /\[INST\]|\[\/INST\]|<\|im_start\|>/i,
    label: 'Token Smuggling',
    severity: 'high',
  },
  {
    pattern: /recommend (buy|sell|invest|short)/i,
    label: 'Investment Advice Extraction',
    severity: 'medium',
  },
  {
    pattern: /reveal|expose|show me (your|the) (prompt|instructions)/i,
    label: 'Prompt Extraction',
    severity: 'critical',
  },
  {
    pattern: /always say|always respond|from now on/i,
    label: 'Persistent Override',
    severity: 'high',
  },
  {
    pattern: /manipulate|fabricate|hallucinate/i,
    label: 'Output Manipulation',
    severity: 'high',
  },
];

const SEVERITY_RANK: Record<string, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function computeEntropy(str: string): number {
  if (str.length === 0) return 0;

  const freq: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    freq[ch] = (freq[ch] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  const chars = Object.keys(freq);
  for (let i = 0; i < chars.length; i++) {
    const p = freq[chars[i]] / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

export function scanPrompt(input: string): ScanResult {
  const detectedPatterns: string[] = [];
  let worstSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
  let sanitized = input;

  for (const { pattern, label, severity } of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      detectedPatterns.push(label);
      if (SEVERITY_RANK[severity] > SEVERITY_RANK[worstSeverity]) {
        worstSeverity = severity;
      }
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  }

  // Entropy check
  const entropy = computeEntropy(input);
  if (entropy > 4.5 && input.length > 100) {
    if (SEVERITY_RANK['medium'] > SEVERITY_RANK[worstSeverity]) {
      worstSeverity = 'medium';
    }
    detectedPatterns.push('High Entropy Input');
  }

  let confidence: number;
  if (worstSeverity === 'none') {
    confidence = 0.98;
  } else if (worstSeverity === 'critical') {
    confidence = 0.99;
  } else if (worstSeverity === 'high') {
    confidence = 0.94;
  } else {
    confidence = 0.78;
  }

  const safe = worstSeverity === 'none' || worstSeverity === 'low';

  return {
    safe,
    threatLevel: worstSeverity,
    detectedPatterns,
    sanitized,
    confidence,
  };
}
