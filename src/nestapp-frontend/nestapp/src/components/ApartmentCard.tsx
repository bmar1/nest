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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-foreground">{apartment.title || 'Apartment Listing'}</h3>
        <div className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
          {apartment.finalScore ? apartment.finalScore.toFixed(0) : 0}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="font-mono text-2xl font-bold text-primary">${apartment.price}/mo</p>
        {apartment.sqft && <p className="text-muted-foreground">{apartment.sqft} sq ft</p>}
        {apartment.bedrooms && <p className="text-muted-foreground">{apartment.bedrooms} bedrooms</p>}
        <p className="text-muted-foreground">{apartment.leaseTermMonths} month lease</p>
      </div>

      {apartment.amenities && apartment.amenities.length > 0 && (
        <div className="mb-4">
          <p className="font-semibold text-sm mb-2 text-foreground">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {apartment.amenities.slice(0, 3).map((amenity, index) => (
              <span key={index} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {apartment.scoreBreakdown && (
        <div className="border-t border-border pt-4 text-sm">
          <p className="font-semibold mb-2 text-foreground">Score breakdown</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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
        className="mt-4 flex w-full items-center justify-center rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        View listing
      </a>
    </div>
  );
}
