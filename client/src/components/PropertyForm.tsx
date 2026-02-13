"use client";

import { CustomFormField } from "@/components/FormField";
import { Form } from "@/components/ui/form";
import { PropertyFormData, propertySchema } from "@/lib/schemas";
import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Property } from "@/types/prismaTypes";
import { X } from "lucide-react";
import Image from "next/image";

interface PropertyFormProps {
  initialData?: Property; // Optional - only provided when editing
  onSubmit: (data: PropertyFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

const PropertyForm = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitButtonText = "Submit",
}: PropertyFormProps) => {
    const [existingPhotos, setExistingPhotos] = React.useState<string[]>(
    initialData?.photoUrls || []
  );
  const [photosToRemove, setPhotosToRemove] = React.useState<string[]>([]);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      pricePerMonth: initialData?.pricePerMonth || 10000,
      securityDeposit: initialData?.securityDeposit || 5000,
      applicationFee: initialData?.applicationFee || 100,
      isPetsAllowed: initialData?.isPetsAllowed ?? true,
      isParkingIncluded: initialData?.isParkingIncluded ?? true,
      photoUrls: [],
      amenities: initialData?.amenities?.join(",") || "",
      highlights: initialData?.highlights?.join(",") || "",
      beds: initialData?.beds || 1,
      baths: initialData?.baths || 1,
      squareFeet: initialData?.squareFeet || 1000,
      propertyType: initialData?.propertyType || undefined,
      address: initialData?.location?.address || "",
      city: initialData?.location?.city || "",
      state: initialData?.location?.state || "",
      country: initialData?.location?.country || "",
      postalCode: initialData?.location?.postalCode || "",
    },
  });

  // Reset form when initialData changes (important for edit mode)
  useEffect(() => {
    if (initialData) {
        setExistingPhotos(initialData.photoUrls || []);
      setPhotosToRemove([]);
      form.reset({
        name: initialData.name,
        description: initialData.description,
        pricePerMonth: initialData.pricePerMonth,
        securityDeposit: initialData.securityDeposit,
        applicationFee: initialData.applicationFee,
        isPetsAllowed: initialData.isPetsAllowed,
        isParkingIncluded: initialData.isParkingIncluded,
        photoUrls: [],
        amenities: initialData.amenities?.join(",") || "",
        highlights: initialData.highlights?.join(",") || "",
        beds: initialData.beds,
        baths: initialData.baths,
        squareFeet: initialData.squareFeet,
        propertyType: initialData.propertyType,
        address: initialData.location?.address || "",
        city: initialData.location?.city || "",
        state: initialData.location?.state || "",
        country: initialData.location?.country || "",
        postalCode: initialData.location?.postalCode || "",
      });
    }
  }, [initialData, form]);

  const handleRemovePhoto = (photoUrl: string) => {
    setExistingPhotos(prev => prev.filter(url => url !== photoUrl));
    setPhotosToRemove(prev => [...prev, photoUrl]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => {
    // Pass both form data and photo management info
    onSubmit({
      ...data,
      existingPhotos,
      photosToRemove,
    });
  })}
      className="p-4 space-y-10">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <CustomFormField name="name" label="Property Name" />
            <CustomFormField
              name="description"
              label="Description"
              type="textarea"
            />
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Fees */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold mb-4">Fees</h2>
          <CustomFormField
            name="pricePerMonth"
            label="Price per Month"
            type="number"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomFormField
              name="securityDeposit"
              label="Security Deposit"
              type="number"
            />
            <CustomFormField
              name="applicationFee"
              label="Application Fee"
              type="number"
            />
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Property Details */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold mb-4">Property Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomFormField
              name="beds"
              label="Number of Beds"
              type="number"
            />
            <CustomFormField
              name="baths"
              label="Number of Baths"
              type="number"
            />
            <CustomFormField
              name="squareFeet"
              label="Square Feet"
              type="number"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CustomFormField
              name="isPetsAllowed"
              label="Pets Allowed"
              type="switch"
            />
            <CustomFormField
              name="isParkingIncluded"
              label="Parking Included"
              type="switch"
            />
          </div>
          <div className="mt-4">
            <CustomFormField
              name="propertyType"
              label="Property Type"
              type="select"
              options={Object.keys(PropertyTypeEnum).map((type) => ({
                value: type,
                label: type,
              }))}
            />
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Amenities and Highlights */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Amenities and Highlights
          </h2>
          <div className="space-y-6">
            <CustomFormField
              name="amenities"
              label="Amenities"
              type="select"
              options={Object.keys(AmenityEnum).map((amenity) => ({
                value: amenity,
                label: amenity,
              }))}
            />
            <CustomFormField
              name="highlights"
              label="Highlights"
              type="select"
              options={Object.keys(HighlightEnum).map((highlight) => ({
                value: highlight,
                label: highlight,
              }))}
            />
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Photos */}
        <div>
        <h2 className="text-lg font-semibold mb-4">Photos</h2>
        
        {/* Display existing photos if in edit mode */}
        {existingPhotos.length > 0 && (
            <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">Current Photos:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingPhotos.map((photoUrl, index) => (
                <div key={photoUrl} className="relative group">
                    <div className="relative h-32 w-full rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                        src={photoUrl}
                        alt={`Property photo ${index + 1}`}
                        fill
                        className="object-cover"
                    />
                    </div>
                    <button
                    type="button"
                    onClick={() => handleRemovePhoto(photoUrl)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    >
                    <X className="w-4 h-4" />
                    </button>
                </div>
                ))}
            </div>
            </div>
        )}

        {/* Upload new photos */}
        <div>
            <p className="text-sm text-gray-600 mb-2">
            {initialData ? "Add new photos (optional):" : "Upload property photos:"}
            </p>
            <CustomFormField
            name="photoUrls"
            label=""
            type="file"
            accept="image/*"
            />
        </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Additional Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold mb-4">
            Additional Information
          </h2>
          <CustomFormField name="address" label="Address" />
          <div className="flex justify-between gap-4">
            <CustomFormField name="city" label="City" className="w-full" />
            <CustomFormField name="state" label="State" className="w-full" />
            <CustomFormField
              name="postalCode"
              label="Postal Code"
              className="w-full"
            />
          </div>
          <CustomFormField name="country" label="Country" />
        </div>

        <Button
          type="submit"
          className="bg-primary-700 text-white w-full mt-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitButtonText}
        </Button>
      </form>
    </Form>
  );
};

export default PropertyForm;