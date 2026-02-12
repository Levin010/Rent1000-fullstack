"use client";

import Header from "@/components/Header";
import PropertyForm from "@/components/PropertyForm";
import { PropertyFormData } from "@/lib/schemas";
import { useCreatePropertyMutation, useGetAuthUserQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import React from "react";

const NewProperty = () => {
  const [createProperty, { isLoading }] = useCreatePropertyMutation();
  const { data: authUser } = useGetAuthUserQuery();
  const router = useRouter();

  const handleSubmit = async (data: PropertyFormData) => {
    if (!authUser?.cognitoInfo?.userId) {
      throw new Error("No manager ID found");
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "photoUrls") {
        const files = value as File[];
        files.forEach((file: File) => {
          formData.append("photos", file);
        });
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    formData.append("managerCognitoId", authUser.cognitoInfo.userId);

    try {
      await createProperty(formData).unwrap();
      router.push("/managers/properties");
    } catch (error) {
      console.error("Failed to create property:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Add New Property"
        subtitle="Create a new property listing with detailed information"
      />
      <div className="bg-white rounded-xl p-6">
        <PropertyForm
          onSubmit={handleSubmit}
          isSubmitting={isLoading}
          submitButtonText="Create Property"
        />
      </div>
    </div>
  );
};

export default NewProperty;