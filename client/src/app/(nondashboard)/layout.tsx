"use client";

import Navbar from '@/components/Navbar';
import { NAVBAR_HEIGHT } from '@/lib/constants';
import { useGetAuthUserQuery } from '@/state/api';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
      const pathname = usePathname();
      const [isLoading, setIsLoading] = useState(true);
  
      useEffect(() => {
        if (!authLoading) {
            if (!authUser) {
                router.push("/signin");
            }
            else {
                const userRole = authUser.userRole?.toLowerCase();
                if (
                    (userRole === "manager" && pathname === "/")
                ) {
                    router.push("/managers/properties", { scroll: false });
                } 
                else {
                    setIsLoading(false);
                }
            }
        }
    }, [authUser, authLoading, router, pathname]);
  
      if (authLoading || isLoading) return <>Loading...</>
      
  console.log("authUser:", authUser)

  return (
    <div className='h-full w-full'>
        <Navbar />
        <main className={`h-full flex w-full flex-col`}
        style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
            {children}
        </main>
    </div>
  );
};

export default Layout