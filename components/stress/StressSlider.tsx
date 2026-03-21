'use client';

interface StressSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  displayValue?: string;
}

export default function StressSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: StressSliderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
      }}>
        <label style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--ink)',
        }}>
          {label}
        </label>
        <span className="font-num" style={{
          fontSize: 13,
          color: 'var(--gold)',
        }}>
          {displayValue ?? value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
