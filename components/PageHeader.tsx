"use client";

import Image from "next/image";

export default function PageHeader() {
  return (
    <div className="flex items-center justify-center h-16">
      <Image
        src="/icons/irekura-logo-light.svg"
        alt="Irekura"
        width={120}
        height={40}
        priority
        className="dark:hidden"
      />
      <Image
        src="/icons/irekura-logo-dark.svg"
        alt="Irekura"
        width={120}
        height={40}
        priority
        className="hidden dark:block"
      />
    </div>
  );
}
