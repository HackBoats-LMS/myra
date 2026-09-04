import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center space-y-6 rounded-none">
        <i className="ri-close-circle-fill text-5xl text-red-500 mx-auto block" />
        <h1 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Invalid Link</h1>
        <p className="text-gray-500">No verification token was provided.</p>
        <Link href="/login" className="inline-block mt-4 text-[#7A0B2E] hover:underline font-bold uppercase tracking-widest text-xs rounded-none">
          Go to Login
        </Link>
      </div>
    );
  }

  // Hash the token to match against stored hash
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: tokenHash }
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return (
      <div className="text-center space-y-6 rounded-none">
        <i className="ri-close-circle-fill text-5xl text-red-500 mx-auto block" />
        <h1 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Link Expired</h1>
        <p className="text-gray-500">Your verification link has expired or is invalid. Please sign up again or request a new link.</p>
        <Link href="/login" className="inline-block mt-4 text-[#7A0B2E] hover:underline font-bold uppercase tracking-widest text-xs rounded-none">
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
    <div className="text-center space-y-6 rounded-none">
      <i className="ri-checkbox-circle-fill text-5xl text-[#7A0B2E] mx-auto block" />
      <h1 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Email Verified!</h1>
      <p className="text-gray-500">Your email has been successfully verified. You can now log into your account.</p>
      <Link href="/login" className="inline-block w-full mt-4 px-4 py-3 bg-[#7A0B2E] hover:bg-[#5C0820] text-white font-bold uppercase tracking-widest transition-colors flex justify-center rounded-none">
        Log In Now
      </Link>
    </div>
  );
}
