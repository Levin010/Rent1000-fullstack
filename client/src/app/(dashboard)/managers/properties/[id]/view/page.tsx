"use client";

import {
  useGetAuthUserQuery,
  useGetPropertyQuery,
  useDeletePropertyMutation,
} from "@/state/api";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useMemo } from "react";
import ImagePreviews from "./ImagePreviews";
import PropertyOverview from "./PropertyOverview";
import PropertyDetails from "./PropertyDetails";
import PropertyLocation from "./PropertyLocation";
import ContactWidget from "./ContactWidget";
import DeletePropertyModal from "./DeletePropertyModal";

const SingleListing = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const router = useRouter();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const { data: authUser } = useGetAuthUserQuery();
  const {
    data: property,
    isError,
    isLoading,
  } = useGetPropertyQuery(propertyId);
  
  const [deleteProperty, { isLoading: isDeleting }] = useDeletePropertyMutation();

  // Manager always sees their own property in this view
  const isManagerOwner = useMemo(() => {
    if (!authUser || !property) return false;
    
    return (
      authUser.userRole === "manager" &&
      authUser.cognitoInfo?.userId === property.managerCognitoId
    );
  }, [authUser, property]);

  const handleDelete = async () => {
    try {
      await deleteProperty(propertyId).unwrap();
      setIsDeleteModalOpen(false);
      router.push("/managers/properties");
    } catch (error) {
      console.error("Failed to delete property:", error);
    }
  };

  const handleEdit = () => {
    router.push(`/managers/properties/${propertyId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading property...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Property not found</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ImagePreviews images={property.photoUrls || []} />
      <div className="flex flex-col md:flex-row justify-center gap-10 mx-10 md:w-2/3 md:mx-auto mt-16 mb-8">
        <div className="order-2 md:order-1">
          <PropertyOverview propertyId={propertyId} />
          <PropertyDetails propertyId={propertyId} />
          <PropertyLocation propertyId={propertyId} />
        </div>

        <div className="order-1 md:order-2">
          <ContactWidget
            onOpenModal={() => {}} // Not used in manager view
            isManagerOwner={isManagerOwner}
            onDelete={() => setIsDeleteModalOpen(true)}
            onEdit={handleEdit}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isManagerOwner && (
        <DeletePropertyModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default SingleListing;