"use client";

import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { Edit, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface ContactWidgetProps {
  onOpenModal: () => void;
  isManagerOwner: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

const ContactWidget = ({
  onOpenModal,
  isManagerOwner,
  onDelete,
  onEdit,
}: ContactWidgetProps) => {
  const { data: authUser } = useGetAuthUserQuery();
  const router = useRouter();

  const handleButtonClick = () => {
    if (authUser) {
      onOpenModal();
    } else {
      router.push("/signin");
    }
  };

  // Manager Owner View
  if (isManagerOwner) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-7 h-fit min-w-[300px]">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-primary-800 mb-2">
            Property Management
          </h3>
          <p className="text-sm text-primary-600">
            You are the owner of this property
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-primary-700 text-white hover:bg-primary-600 flex items-center justify-center gap-2"
            onClick={onEdit}
          >
            <Edit size={18} />
            Edit Property
          </Button>

          <Button
            className="w-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
            onClick={onDelete}
            variant="destructive"
          >
            <Trash2 size={18} />
            Delete Property
          </Button>
        </div>

        <hr className="my-4" />
        <div className="text-sm">
          <div className="text-primary-600 mb-1">
            Language: English, Swahili.
          </div>
          <div className="text-primary-600">
            Open by appointment on Monday - Friday
          </div>
        </div>
      </div>
    );
  }

  // Tenant View (Default)
  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-7 h-fit min-w-[300px]">
      {/* Contact Property */}
      <div className="flex items-center gap-5 mb-4 border border-primary-200 p-4 rounded-xl">
        <div className="flex items-center p-4 bg-primary-900 rounded-full">
          <Phone className="text-primary-50" size={15} />
        </div>
        <div>
          <p>Contact This Property</p>
          <div className="text-lg font-bold text-primary-800">
            +254 712 345 678
          </div>
        </div>
      </div>
      <Button
        className="w-full bg-primary-700 text-white hover:bg-primary-600"
        onClick={handleButtonClick}
      >
        {authUser ? "Submit Application" : "Sign In to Apply"}
      </Button>

      <hr className="my-4" />
      <div className="text-sm">
        <div className="text-primary-600 mb-1">
          Language: English, Swahili.
        </div>
        <div className="text-primary-600">
          Open by appointment on Monday - Friday
        </div>
      </div>
    </div>
  );
};

export default ContactWidget;