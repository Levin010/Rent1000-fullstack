"use client";

import Header from "@/components/Header";
import PropertyForm from "@/components/PropertyForm";
import Loading from "@/components/Loading";
import { PropertyFormData } from "@/lib/schemas";
import {
  useUpdatePropertyMutation,
  useGetPropertyQuery,
  useGetAuthUserQuery,
} from "@/state/api";
import { useParams, useRouter } from "next/navigation";
import React from "react";

const EditProperty = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const router = useRouter();

  const { data: authUser } = useGetAuthUserQuery();
  const { data: property, isLoading: isLoadingProperty } =
    useGetPropertyQuery(propertyId);
  const [updateProperty, { isLoading: isUpdating }] =
    useUpdatePropertyMutation();

  const handleSubmit = async (data: PropertyFormData) => {
  if (!authUser?.cognitoInfo?.userId) {
    throw new Error("No manager ID found");
  }

  if (property?.managerCognitoId !== authUser.cognitoInfo.userId) {
    throw new Error("You don't have permission to edit this property");
  }

  const formData = new FormData();
  
  // Add existing photos that weren't removed
  if (data.existingPhotos && data.existingPhotos.length > 0) {
    formData.append("existingPhotos", JSON.stringify(data.existingPhotos));
  }
  
  // Add photos to remove
  if (data.photosToRemove && data.photosToRemove.length > 0) {
    formData.append("photosToRemove", JSON.stringify(data.photosToRemove));
  }

  Object.entries(data).forEach(([key, value]) => {
    // Skip our custom photo fields as we've already handled them
    if (key === "existingPhotos" || key === "photosToRemove") {
      return;
    }
    
    if (key === "photoUrls") {
      const files = value as File[];
      if (files.length > 0) {
        files.forEach((file: File) => {
          formData.append("photos", file);
        });
      }
    } else if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  try {
    await updateProperty({ id: propertyId, data: formData }).unwrap();
    router.push(`/search/${propertyId}`); // or `/search/${propertyId}` for search edit page
  } catch (error) {
    console.error("Failed to update property:", error);
  }
};

  if (isLoadingProperty) {
    return <Loading />;
  }

  if (!property) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Property not found</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header
        title="Edit Property"
        subtitle="Update your property listing information"
      />
      <div className="bg-white rounded-xl p-6">
        <PropertyForm
          initialData={property}
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
          submitButtonText="Update Property"
        />
      </div>
    </div>
  );
};

export default EditProperty;