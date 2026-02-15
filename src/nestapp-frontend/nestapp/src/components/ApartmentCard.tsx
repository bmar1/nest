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

interface ApartmentCardProps {
  apartment: Apartment;
}

export function ApartmentCard({ apartment }: ApartmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{apartment.title || 'Apartment Listing'}</h3>
        <div className="bg-green-700 text-white px-3 py-1 rounded-full text-sm font-bold">
          {apartment.finalScore ? apartment.finalScore.toFixed(0) : 0}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-2xl font-bold text-green-800">${apartment.price}/mo</p>
        {apartment.sqft && <p className="text-gray-600">{apartment.sqft} sq ft</p>}
        {apartment.bedrooms && <p className="text-gray-600">{apartment.bedrooms} bedrooms</p>}
        <p className="text-gray-600">{apartment.leaseTermMonths} month lease</p>
      </div>

      {apartment.amenities && apartment.amenities.length > 0 && (
        <div className="mb-4">
          <p className="font-semibold text-sm mb-2">Amenities:</p>
          <div className="flex flex-wrap gap-2">
            {apartment.amenities.slice(0, 3).map((amenity, index) => (
              <span key={index} className="bg-gray-200 px-2 py-1 rounded text-xs">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {apartment.scoreBreakdown && (
        <div className="border-t pt-4 text-sm">
          <p className="font-semibold mb-2">Score Breakdown:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Price: {apartment.scoreBreakdown.priceScore?.toFixed(1)}</div>
            <div>Space: {apartment.scoreBreakdown.spaceScore?.toFixed(1)}</div>
            <div>Amenities: {apartment.scoreBreakdown.amenitiesScore?.toFixed(1)}</div>
            <div>Lease: {apartment.scoreBreakdown.leaseScore?.toFixed(1)}</div>
          </div>
        </div>
      )}

      <a
        href={apartment.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-4 text-center bg-green-700 text-white py-2 rounded hover:bg-green-800"
      >
        View Listing
      </a>
    </div>
  );
}
