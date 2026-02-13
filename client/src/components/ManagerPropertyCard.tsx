"use client";

import Card from "./Card";
import { Property } from "@/types/prismaTypes";
import { useRouter } from "next/navigation";
import { Eye, Users } from "lucide-react";

interface ManagerPropertyCardProps {
  property: Property;
}

const ManagerPropertyCard = ({ property }: ManagerPropertyCardProps) => {
  const router = useRouter();

  return (
    <div className="relative">
      {/* Base Card Component - No Link */}
      <Card
        property={property}
        isFavorite={false}
        onFavoriteToggle={() => {}}
        showFavoriteButton={false}
        propertyLink={undefined} // No link on the card itself
      />
      
      {/* Action Buttons */}
      <div className="flex gap-2 px-4 pb-4 -mt-2">
        <button
          onClick={() => router.push(`/managers/properties/${property.id}/view`)}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-700 text-white py-2.5 px-4 rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium shadow-sm"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
        <button
          onClick={() => router.push(`/managers/properties/${property.id}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-secondary-700 text-white py-2.5 px-4 rounded-lg hover:bg-secondary-600 transition-colors text-sm font-medium shadow-sm"
        >
          <Users className="w-4 h-4" />
          Tenants
        </button>
      </div>
    </div>
  );
};

export default ManagerPropertyCard;