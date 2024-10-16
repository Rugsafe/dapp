"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type DropdownProps = {
  label: string;
  links: { label: string; path: string }[];
};

export function Dropdown({ label, links }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div 
      className="relative group"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="text-white hover:text-gray-300 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      <ul 
        className={`absolute left-0 top-full mt-1 w-48 bg-[#1a1b2e] rounded-md shadow-lg z-10 transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
        }`}
      >
        {links.map((link, idx) => (
          <li key={idx}>
            <Link
              href={link.path}
              className="block px-4 py-2 text-sm text-white hover:bg-[#2a2b3e] transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}