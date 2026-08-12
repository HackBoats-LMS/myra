import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
        <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Invalid Link</h1>
        <p className="text-gray-500">No verification token was provided.</p>
        <Link href="/login" className="inline-block mt-4 text-[#B6925B] hover:underline font-bold uppercase tracking-widest text-xs">
          Go to Login
        </Link>
      </div>
    );
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return (
      <div className="text-center space-y-6">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
        <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Link Expired</h1>
        <p className="text-gray-500">Your verification link has expired or is invalid. Please sign up again or request a new link.</p>
        <Link href="/login" className="inline-block mt-4 text-[#B6925B] hover:underline font-bold uppercase tracking-widest text-xs">
          Go to Login
        </Link>
      </div>
    );
  }

  // Update user
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.email }
  });

  if (user) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id }
      })
    ]);
  }

  return (
    <div className="text-center space-y-6">
      <CheckCircleIcon className="w-16 h-16 text-[#B6925B] mx-auto" />
      <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Email Verified!</h1>
      <p className="text-gray-500">Your email has been successfully verified. You can now log into your account.</p>
      <Link href="/login" className="inline-block w-full mt-4 px-4 py-3 bg-[#B6925B] hover:bg-[#9c7d4e] text-white font-bold uppercase tracking-widest transition-colors flex justify-center">
        Log In Now
      </Link>
    </div>
  );
}
