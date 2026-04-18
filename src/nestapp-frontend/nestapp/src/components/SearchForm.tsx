import { useState } from 'react';
import axios from 'axios';
import { getSearchSubmitErrorMessage } from '@/lib/searchSubmitErrors';

interface SearchFormData {
  priority: 'BUDGET' | 'SPACE' | 'AMENITIES' | 'BALANCED';
  maxPrice: number;
  minSqft: number;
  desiredAmenities: string[];
  maxLeaseMonths?: number;
}

interface SearchFormProps {
  onSearchSubmitted: (searchId: string) => void;
}

export function SearchForm({ onSearchSubmitted }: SearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    priority: 'BALANCED',
    maxPrice: 2500,
    minSqft: 800,
    desiredAmenities: [],
    maxLeaseMonths: 12,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
  
    try {
      const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
      const response = await axios.post(`${base}/api/v1/search`, formData);
      onSearchSubmitted(response.data.searchId);
    } catch (err) {
      console.error('Error submitting search:', err);
      setError(getSearchSubmitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-card rounded-lg shadow-md border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Find Your Perfect Apartment</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-foreground">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded"
          >
            <option value="BUDGET">Budget Focused</option>
            <option value="SPACE">Space Focused</option>
            <option value="AMENITIES">Amenities Focused</option>
            <option value="BALANCED">Balanced</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Max Price ($)</label>
          <input
            type="number"
            value={formData.maxPrice}
            onChange={(e) => setFormData({ ...formData, maxPrice: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded"
            min="500"
          />
        </div>

        <div>
          <label className="block mb-2">Min Square Feet</label>
          <input
            type="number"
            value={formData.minSqft}
            onChange={(e) => setFormData({ ...formData, minSqft: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded"
            min="300"
          />
        </div>

        <div>
          <label className="block mb-2">Max Lease (months)</label>
          <input
            type="number"
            value={formData.maxLeaseMonths}
            onChange={(e) => setFormData({ ...formData, maxLeaseMonths: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded"
            min="1"
            max="24"
          />
        </div>

        {error && (
          <div
            className={
              error.startsWith('Too many search')
                ? 'rounded-md border border-amber-500/50 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                : 'rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive'
            }
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-700 text-white py-3 rounded hover:bg-green-800 disabled:opacity-60"
        >
          {isSubmitting ? 'Searching…' : 'Search Apartments'}
        </button>
      </form>
    </div>
  );
}
