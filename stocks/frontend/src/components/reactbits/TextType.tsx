import React, { useState, useEffect } from 'react';

interface TextTypeProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  cursorClassName?: string;
}

export const TextType: React.FC<TextTypeProps> = ({
  words,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 1800,
  className = '',
  cursorClassName = ''
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setCurrentText(words[0] || '');
      return;
    }

    const currentFullWord = words[currentWordIndex] || '';

    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && currentText === currentFullWord) {
      // Finished typing current word, pause before deleting
      timer = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && currentText === '') {
      // Finished deleting, move to next word
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    } else if (isDeleting) {
      // Deleting letters
      timer = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1));
      }, deletingSpeed);
    } else {
      // Typing letters
      timer = setTimeout(() => {
        setCurrentText(currentFullWord.slice(0, currentText.length + 1));
      }, typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{currentText}</span>
      <span
        aria-hidden="true"
        className={`inline-block w-0.5 h-[1.1em] ml-1 bg-[var(--primary)] animate-pulse ${cursorClassName}`}
      />
    </span>
  );
};
