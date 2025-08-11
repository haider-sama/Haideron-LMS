import React, { useEffect, useState } from "react";
import { FaSearch, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

interface SearchBarProps {
    value: string;                  // Controlled value
    onSearch: (query: string) => void;
    showAdvanced?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onSearch, showAdvanced = true }) => {
    const [query, setQuery] = useState(value);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        onSearch(e.target.value.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSearch(query.trim());
        }
    };

    const navigate = useNavigate();

    const goToAdvancedSearch = () => {
        navigate("/advanced-search");
    };

    return (
        <div className="relative w-64 rounded-md shadow-sm overflow-hidden border border-gray-300">
            <input
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full bg-gray-100 text-sm text-gray-800 pl-4 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="absolute top-0 right-0 h-full flex items-center">
                <button
                    onClick={() => onSearch(query.trim())}
                    title="Search"
                    className="h-full border-l border-gray-300 bg-white text-gray-600 hover:bg-gray-200 transition"
                >
                    <FaSearch className="mx-2" />
                </button>
                {showAdvanced && (
                    <button
                        onClick={goToAdvancedSearch}
                        title="Advanced Search"
                        className="h-full border-l border-gray-300 bg-white text-gray-600 hover:bg-gray-200 transition"
                    >
                        <FaCog className="mx-2" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;