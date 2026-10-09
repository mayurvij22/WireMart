import { useEffect, useRef, useState } from 'react';

const DEFAULT_CLASSES = { form: 'search', icon: 'search-icon', input: '', clear: 'search-clear' };

/** Search box that reports changes after the user pauses typing (saves Firestore reads). */
export default function SearchBar({ value, onChange, placeholder = 'Search products…', delay = 500, classes = DEFAULT_CLASSES }) {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text.trim() === value) return;
    const t = setTimeout(() => onChange(text.trim()), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <form
      className={classes.form}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onChange(text.trim());
        inputRef.current?.blur();
      }}
    >
      <span className={classes.icon} aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        className={classes.input}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={text}
        placeholder={placeholder}
        aria-label="Search products"
        onChange={(e) => setText(e.target.value)}
      />
      {text && (
        <button
          type="button"
          className={classes.clear}
          aria-label="Clear search"
          onClick={() => {
            setText('');
            onChange('');
          }}
        >
          ✕
        </button>
      )}
    </form>
  );
}
