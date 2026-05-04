import { useEffect, useState } from 'react';
import axios from 'axios';
import { ApartmentCard } from './ApartmentCard';
import { getApiBaseUrl } from '@/lib/apiBaseUrl';

interface Apartment {
  id: string;
  title: string;
  price: number;
  sqft: number;
  bedrooms: number;
  amenities: string[];
  leaseTermMonths: number;
  sourceUrl: string;
  finalScore: number;
  scoreBreakdown: {
    priceScore: number;
    spaceScore: number;
    amenitiesScore: number;
    leaseScore: number;
  };
}

interface ResultsPageProps {
  searchId: string;
}

export function ResultsPage({ searchId }: ResultsPageProps) {
  const [status, setStatus] = useState<string>('PENDING');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pollResults = async () => {
      try {
        const base = getApiBaseUrl();
        const response = await axios.get(`${base}/api/v1/search/${searchId}/results`);
        setStatus(response.data.status);
        
        if (response.data.status === 'COMPLETED') {
          setApartments(response.data.apartments || []);
          setLoading(false);
        } else if (response.data.status === 'FAILED') {
          setLoading(false);
        } else {
          setTimeout(pollResults, 5000);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        setLoading(false);
      }
    };

    pollResults();
  }, [searchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-lg">Searching for apartments...</p>
          <p className="text-sm text-gray-600">Status: {status}</p>
        </div>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Search Failed</h2>
        <p className="mt-4">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Search Results</h1>
      <p className="mb-6 text-gray-600">Found {apartments.length} apartments</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apartments.map((apartment) => (
          <ApartmentCard key={apartment.id} apartment={apartment} />
        ))}
      </div>
    </div>
  );
}
