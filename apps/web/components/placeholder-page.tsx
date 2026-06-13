import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>
        <p className="text-gray-300">
          This page is under construction. Content for {title} will be added soon.
        </p>
        <Link href="/" className="inline-block mt-4 text-purple-400 hover:text-purple-300">
          ← Back to Landing Page
        </Link>
      </div>
    </div>
  );
}
