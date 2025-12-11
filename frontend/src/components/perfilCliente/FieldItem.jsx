export default function FieldItem({ label, value }) {
    return (
      <div className="field-item">
        {label && <span className="field-label">{label}</span>}
        <span className="field-value">{value}</span>
      </div>
    );
  }