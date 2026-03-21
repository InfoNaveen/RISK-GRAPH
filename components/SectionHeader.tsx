interface SectionHeaderProps {
  label: string;
  title: string;
  description: string;
}

export default function SectionHeader({ label, title, description }: SectionHeaderProps) {
  return (
    <div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        color: 'var(--gold)',
        fontWeight: 500,
        marginBottom: 8,
      }}>
        {label}
      </div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 28,
        fontWeight: 400,
        color: 'var(--ink)',
        margin: '0 0 8px 0',
        lineHeight: 1.2,
      }}>
        {title}
      </h2>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: 'var(--ink-muted)',
        margin: 0,
        lineHeight: 1.5,
        maxWidth: 600,
      }}>
        {description}
      </p>
      <hr style={{
        border: 'none',
        borderTop: '1px solid var(--border)',
        margin: '24px 0',
      }} />
    </div>
  );
}
